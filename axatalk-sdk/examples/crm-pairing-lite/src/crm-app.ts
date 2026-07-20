/**
 * Integrator-facing CRM helpers — public `@axatalk/sdk` surface only.
 * Secure defaults: revision-bound mutations, typed errors, no privileged pairing.
 */

import {
  isAxatalkClientError,
  type AxatalkClient,
  type CallMutationResult,
  type PrepareLogoutResult
} from '@axatalk/sdk';

import { formatSafeError } from './safe-error.js';

export type CrmActionLog = {
  readonly step: string;
  readonly ok: boolean;
  readonly detail?: string;
};

export const SAFE_REQUESTED_CAPABILITIES = [
  'session.read.redacted',
  'window.show',
  'call.originate',
  'call.control',
  'session.logout',
  'operator.status.write'
] as const;

export async function waitForReady(
  client: AxatalkClient,
  timeoutMs = 5_000
): Promise<void> {
  await client.waitUntil((state) => state === 'ready', timeoutMs);
}

export async function loadRevision(client: AxatalkClient): Promise<number> {
  const cached = client.getRevision();
  if (cached !== undefined) {
    return cached;
  }
  const snapshot = await client.getSnapshot();
  return snapshot.revision;
}

export async function originateDemoCall(
  client: AxatalkClient,
  destination = 'ext:1001'
): Promise<
  | { readonly ok: true; readonly result: CallMutationResult }
  | { readonly ok: false; readonly safeError: string; readonly code?: string }
> {
  const expectedRevision = await loadRevision(client);
  try {
    const result = await client.calls.originate({
      destination,
      expectedRevision
    });
    return { ok: true, result };
  } catch (error: unknown) {
    const code = isAxatalkClientError(error) ? error.code : undefined;
    return { ok: false, safeError: formatSafeError(error), ...(code ? { code } : {}) };
  }
}

export type PrepareLogoutOutcome =
  | { readonly kind: 'prepared'; readonly result: PrepareLogoutResult }
  | {
      readonly kind: 'interaction_required';
      readonly logoutToken: string;
      readonly safeError: string;
    }
  | { readonly kind: 'failed'; readonly safeError: string; readonly code?: string };

export async function prepareLogoutDemo(
  client: AxatalkClient
): Promise<PrepareLogoutOutcome> {
  const expectedRevision = await loadRevision(client);
  try {
    const result = await client.account.prepareLogout({ expectedRevision });
    return { kind: 'prepared', result };
  } catch (error: unknown) {
    if (isAxatalkClientError(error) && error.code === 'interaction_required') {
      const token = error.details?.['logoutToken'];
      if (typeof token === 'string' && token.length > 0) {
        return {
          kind: 'interaction_required',
          logoutToken: token,
          safeError: formatSafeError(error)
        };
      }
      return {
        kind: 'failed',
        safeError: formatSafeError(error),
        code: error.code
      };
    }
    const code = isAxatalkClientError(error) ? error.code : undefined;
    return {
      kind: 'failed',
      safeError: formatSafeError(error),
      ...(code ? { code } : {})
    };
  }
}

export async function activateIfGranted(
  client: AxatalkClient,
  profileRef: string
): Promise<
  | { readonly ok: true; readonly revision: number }
  | {
      readonly ok: false;
      readonly skipped?: true;
      readonly safeError: string;
      readonly code?: string;
    }
> {
  if (!client.getGrantedCapabilities().includes('account.activate')) {
    return {
      ok: false,
      skipped: true,
      safeError: 'activate_skipped_missing_grant',
      code: 'forbidden'
    };
  }
  const expectedRevision = await loadRevision(client);
  try {
    const result = await client.account.activateProfile({
      profileRef,
      expectedRevision
    });
    return { ok: true, revision: result.revision };
  } catch (error: unknown) {
    const code = isAxatalkClientError(error) ? error.code : undefined;
    return { ok: false, safeError: formatSafeError(error), ...(code ? { code } : {}) };
  }
}

export function subscribeSnapshotRevision(
  client: AxatalkClient,
  onRevision: (revision: number) => void
): () => void {
  return client.subscribe('registration:changed', (event) => {
    onRevision(event.revision);
  });
}
