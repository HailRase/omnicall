/**
 * CRM pairing lite demo driver (fake peer). Used by SDK-09 Vitest smoke.
 */

import {
  activateIfGranted,
  originateDemoCall,
  logoutDemo,
  subscribeSnapshotRevision,
  waitForReady
} from '../../../../examples/crm-pairing-lite/src/crm-app.js';
import {
  createFakePeerHarness,
  type FakePeerHarness
} from './crm-pairing-lite-harness.js';

export type DemoReport = {
  readonly ready: boolean;
  readonly snapshotRevision: number | undefined;
  readonly originateOk: boolean;
  readonly originateForbiddenCode: string | undefined;
  readonly logoutInteraction: boolean;
  readonly activateOk: boolean;
  readonly disconnectSensitive: {
    readonly activate: number;
    readonly hangup: number;
    readonly logout: number;
  };
  readonly storageUsesWebStorage: boolean;
};

function expectLocalForbiddenNoFrame(
  harness: FakePeerHarness,
  result: { readonly ok: boolean; readonly code?: string }
): void {
  if (result.ok || result.code !== 'forbidden') {
    throw new Error('expected local forbidden without call.originate');
  }
  if (harness.countCommand('call:originate') !== 0) {
    throw new Error('forbidden path must not send call:originate');
  }
}

function isMemoryPopKeyStore(
  keyStore: FakePeerHarness['keyStore']
): boolean {
  return typeof keyStore.peek === 'function';
}

function webStorageHasOmniCallKeys(storage: Storage): boolean {
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key !== null && /omnicall|pop-key|pairing/i.test(key)) {
      return true;
    }
  }
  return false;
}

/**
 * Runtime proof: demo harnesses must use memory PoP (`peek`) and must not leave
 * OmniCall material in `localStorage` / `sessionStorage` when those globals exist.
 */
export function detectDemoWebStorageUsage(
  harnesses: readonly FakePeerHarness[]
): boolean {
  for (const harness of harnesses) {
    if (!isMemoryPopKeyStore(harness.keyStore)) {
      return true;
    }
  }
  const local =
    typeof globalThis.localStorage === 'undefined'
      ? undefined
      : globalThis.localStorage;
  const session =
    typeof globalThis.sessionStorage === 'undefined'
      ? undefined
      : globalThis.sessionStorage;
  if (local !== undefined && webStorageHasOmniCallKeys(local)) {
    return true;
  }
  if (session !== undefined && webStorageHasOmniCallKeys(session)) {
    return true;
  }
  return false;
}

export async function runCrmPairingLiteDemo(): Promise<DemoReport> {
  const harness = createFakePeerHarness({
    grantedCapabilities: [
      'session.read.redacted',
      'window.show',
      'session.logout',
      'call.originate',
      'call.control',
      'operator.status.write',
      'account.activate'
    ]
  });

  let lastEventRevision: number | undefined;
  const stop = subscribeSnapshotRevision(harness.client, (revision) => {
    lastEventRevision = revision;
  });

  await harness.reachReady();
  await waitForReady(harness.client);
  const snapshotRevision = harness.client.getRevision();

  const originatePending = originateDemoCall(harness.client, 'ext:1001');
  const originateReply = harness.replyOriginateSuccess('call_demo_001', 14);
  const [originate] = await Promise.all([originatePending, originateReply]);

  const forbiddenHarness = createFakePeerHarness({
    grantedCapabilities: [
      'session.read.redacted',
      'window.show',
      'session.logout',
      'call.control',
      'operator.status.write'
    ]
  });
  await forbiddenHarness.reachReady();
  const forbidden = await originateDemoCall(forbiddenHarness.client, 'ext:1002');
  expectLocalForbiddenNoFrame(forbiddenHarness, forbidden);
  forbiddenHarness.client.disconnect();

  const logoutPending = logoutDemo(harness.client);
  const logoutReply = harness.replyLogoutInteractionRequired([
    { id: 90, label: 'End of shift', kind: 'logout' }
  ]);
  const [logout] = await Promise.all([logoutPending, logoutReply]);

  const activatePending = activateIfGranted(harness.client, 'profile_ref_demo_001');
  const activateReply = harness.replyActivateSuccess(15);
  const [activate] = await Promise.all([activatePending, activateReply]);

  const disconnectSensitive = harness.disconnectAndCountSensitive();
  stop();

  void lastEventRevision;

  return {
    ready: true,
    snapshotRevision,
    originateOk: originate.ok,
    originateForbiddenCode: forbidden.ok ? undefined : forbidden.code,
    logoutInteraction: logout.kind === 'interaction_required',
    activateOk: activate.ok,
    disconnectSensitive,
    storageUsesWebStorage: detectDemoWebStorageUsage([harness, forbiddenHarness])
  };
}
