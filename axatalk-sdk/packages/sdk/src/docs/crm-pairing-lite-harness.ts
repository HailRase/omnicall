/**
 * Workspace-only fake peer wiring for the CRM example (SDK-09).
 * Not packed — lives under src/docs and is excluded from npm via package files.
 */

import {
  createAxatalkClient,
  createFakeScheduler,
  createFixedJitterSource,
  createMemoryPopKeyStore,
  createRecordingDiagnosticsSink,
  type AxatalkClient
} from '@axata/axatalk-sdk';
import {
  buildPairingApproved,
  buildPairingPending,
  buildServerHello,
  countSentType,
  findSentType,
  replyCommandFailure,
  replyCommandSuccess,
  replyToAuthPing,
  replyToGetSnapshot
} from '../internal/auth-test-peer.js';
import { createFakeTransportController } from '../internal/fake-transport.js';
import { SAFE_REQUESTED_CAPABILITIES } from '../../../../examples/crm-pairing-lite/src/crm-app.js';

export type DemoCap =
  | 'session.read.redacted'
  | 'window.show'
  | 'session.logout'
  | 'call.originate'
  | 'call.control'
  | 'operator.status.write'
  | 'account.activate';

export type FakePeerHarness = {
  readonly client: AxatalkClient;
  readonly scheduler: ReturnType<typeof createFakeScheduler>;
  readonly transports: ReturnType<typeof createFakeTransportController>;
  readonly keyStore: ReturnType<typeof createMemoryPopKeyStore>;
  readonly grantedCapabilities: readonly DemoCap[];
  readonly reachReady: () => Promise<void>;
  readonly replyOriginateSuccess: (callId: string, revision: number) => Promise<void>;
  readonly replyPrepareInteractionRequired: (logoutToken: string) => Promise<void>;
  readonly replyActivateSuccess: (revision: number) => Promise<void>;
  readonly countCommand: (type: string) => number;
  readonly disconnectAndCountSensitive: () => {
    readonly activate: number;
    readonly hangup: number;
    readonly confirmLogout: number;
  };
};

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function waitFor(
  predicate: () => boolean,
  attempts = 100
): Promise<void> {
  for (let index = 0; index < attempts; index += 1) {
    if (predicate()) {
      return;
    }
    await flush();
  }
  throw new Error('waitFor timeout');
}

export function createFakePeerHarness(input?: {
  readonly grantedCapabilities?: readonly DemoCap[];
  readonly requestedCapabilities?: readonly DemoCap[];
}): FakePeerHarness {
  const scheduler = createFakeScheduler(1_700_000_000_000);
  const transports = createFakeTransportController();
  const diagnostics = createRecordingDiagnosticsSink();
  const keyStore = createMemoryPopKeyStore();
  const granted = input?.grantedCapabilities ?? [
    ...SAFE_REQUESTED_CAPABILITIES,
    'account.activate' as const
  ];
  const requested = input?.requestedCapabilities ?? [...SAFE_REQUESTED_CAPABILITIES];

  const client = createAxatalkClient({
    url: 'ws://127.0.0.1:17341/axatalk/v1/ws',
    origin: 'https://crm.example',
    application: { name: 'crm-pairing-lite', version: '0.0.0-example' },
    sdkVersion: '0.0.0-example',
    requestedProfile: 'call_controller',
    requestedCapabilities: requested,
    keyStore,
    transportFactory: transports.create,
    scheduler,
    jitter: createFixedJitterSource(0.5),
    diagnostics,
    defaultRequestTimeoutMs: 500,
    reconnect: {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1_000,
      jitterRatio: 0
    },
    heartbeat: { enabled: false, intervalMs: 1_000, timeoutMs: 200 }
  });

  const reachReady = async (): Promise<void> => {
    await client.connect();
    transports.last()?.simulateOpen();
    await waitFor(() => Boolean(findSentType(transports.last()!, 'sdk:client-hello')));
    transports.last()!.simulateMessage(buildServerHello({ pairingRequired: true }));
    await waitFor(() => client.getState() === 'pairing_required');
    await waitFor(() => Boolean(findSentType(transports.last()!, 'pairing:request')));
    const request = findSentType(transports.last()!, 'pairing:request') as {
      clientId: string;
      requestedCapabilities?: readonly string[];
    };
    if (request.requestedCapabilities?.includes('account.activate')) {
      throw new Error('pairing request must not include account.activate');
    }
    if (request.requestedCapabilities?.includes('window.hide')) {
      throw new Error('pairing request must not include window.hide');
    }
    transports.last()!.simulateMessage(buildPairingPending());
    transports.last()!.simulateMessage(
      buildPairingApproved({
        clientId: request.clientId,
        profile: 'call_controller',
        grantedCapabilities: granted
      })
    );
    await waitFor(() => client.getState() === 'reconnecting');
    scheduler.advanceBy(100);
    await waitFor(() => client.getState() === 'connecting');
    const second = transports.last()!;
    second.simulateOpen();
    await waitFor(() => Boolean(findSentType(second, 'sdk:client-hello')));
    second.simulateMessage(buildServerHello({ pairingRequired: false }));
    await waitFor(() => Boolean(findSentType(second, 'sdk:auth-proof')));
    await waitFor(() => replyToAuthPing(second));
    await waitFor(() => client.getState() === 'ready');
    await waitFor(() => Boolean(findSentType(second, 'sdk:get-snapshot')));
    if (!replyToGetSnapshot(second)) {
      throw new Error('snapshot reply failed');
    }
    await waitFor(() => client.getCachedSnapshot() !== undefined);
  };

  const waitForCommand = async (type: string): Promise<void> => {
    await waitFor(() => Boolean(findSentType(transports.last()!, type)));
  };

  return {
    client,
    scheduler,
    transports,
    keyStore,
    grantedCapabilities: granted,
    reachReady,
    replyOriginateSuccess: async (callId, revision) => {
      await waitForCommand('call:originate');
      replyCommandSuccess(
        transports.last()!,
        'call:originate',
        { callId, accepted: true },
        revision
      );
    },
    replyPrepareInteractionRequired: async (logoutToken) => {
      await waitForCommand('account:prepare-logout');
      replyCommandFailure(transports.last()!, 'account:prepare-logout', {
        code: 'interaction_required',
        retryable: false,
        details: { logoutToken, requiresReason: true }
      });
    },
    replyActivateSuccess: async (revision) => {
      await waitForCommand('account:activate-profile');
      replyCommandSuccess(
        transports.last()!,
        'account:activate-profile',
        { activated: true, mode: 'sip_only' },
        revision
      );
    },
    countCommand: (type) => countSentType(transports.last()!, type),
    disconnectAndCountSensitive: () => {
      const beforeActivate = countSentType(transports.last()!, 'account:activate-profile');
      const beforeHangup = countSentType(transports.last()!, 'call:hangup');
      const beforeConfirm = countSentType(transports.last()!, 'account:confirm-logout');
      client.disconnect();
      return {
        activate:
          countSentType(transports.last()!, 'account:activate-profile') - beforeActivate,
        hangup: countSentType(transports.last()!, 'call:hangup') - beforeHangup,
        confirmLogout:
          countSentType(transports.last()!, 'account:confirm-logout') - beforeConfirm
      };
    }
  };
}
