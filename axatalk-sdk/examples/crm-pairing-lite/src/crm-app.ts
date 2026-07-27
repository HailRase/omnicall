/**
 * Integrator-facing CRM helpers — public `@axata/axatalk-sdk` surface only.
 * Secure defaults: revision-bound mutations, typed errors, no privileged pairing.
 */

import {
  isAxatalkClientError,
  isInteractionRequiredError,
  readInteractionRequiredDetails,
  type AxatalkClient,
  type CallMutationResult,
  type LogoutResult,
  type OperatorReason
} from '@axata/axatalk-sdk';

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
  'operator.status.write',
  'operator.campaign.read',
  'ocp.acd_context.read'
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

export type LogoutOutcome =
  | { readonly kind: 'logged_out'; readonly result: LogoutResult }
  | {
      readonly kind: 'interaction_required';
      readonly requiresReason: true;
      readonly reasons: readonly OperatorReason[];
      readonly safeError: string;
    }
  | { readonly kind: 'failed'; readonly safeError: string; readonly code?: string };

/**
 * Single-shot logout. Host cancels by not calling again (no logoutToken).
 * Prefer `getReasons()` + filter `kind === 'logout'` before retrying with reasonId.
 */
export async function logoutDemo(client: AxatalkClient): Promise<LogoutOutcome> {
  const expectedRevision = await loadRevision(client);
  try {
    const result = await client.account.logout({ expectedRevision });
    return { kind: 'logged_out', result };
  } catch (error: unknown) {
    if (isInteractionRequiredError(error)) {
      const parsed = readInteractionRequiredDetails(error.details);
      if (parsed !== undefined) {
        return {
          kind: 'interaction_required',
          requiresReason: true,
          reasons: parsed.reasons,
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
  login: string
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
      login,
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
