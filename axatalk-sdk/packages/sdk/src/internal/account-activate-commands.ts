/**
 * Capability-gated saved-profile activation runner (SDK-08).
 * Privileged `account.activate` — server-granted only; never pairing-default.
 */

import type { CapabilityId } from '@axatalk/protocol';

import { buildAccountActivateProfileBody } from './account-activate-wire.js';
import { createClientError } from './client-errors.js';
import type { ConnectionSession } from './connection-session.js';
import {
  guardCapability,
  guardReady,
  mapReplyFailure,
  requireWireIdentity
} from './product-commands.js';
import type { Scheduler } from './scheduler.js';

const SECRET_RESULT_KEYS = new Set([
  'password',
  'apiKey',
  'sipPassword',
  'token',
  'secret',
  'pairingSecret',
  'privateKey'
]);

const MODE_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;

/** Successful activate-profile. @public */
export type ActivateProfileResult = {
  readonly activated: true;
  readonly mode: string;
  readonly profileLabel?: string;
  readonly revision: number;
};

export type AccountActivateCommandApi = {
  readonly activateProfile: (input: {
    readonly profileRef: string;
    readonly expectedRevision: number;
  }) => Promise<ActivateProfileResult>;
};

function hasSecretResultKeys(
  result: Readonly<Record<string, unknown>>
): boolean {
  for (const key of Object.keys(result)) {
    if (SECRET_RESULT_KEYS.has(key)) {
      return true;
    }
  }
  return false;
}

function readActivateProfileResult(reply: {
  readonly revision: number;
  readonly result: Readonly<Record<string, unknown>>;
}): ActivateProfileResult {
  if (hasSecretResultKeys(reply.result)) {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  const activated = reply.result['activated'];
  const mode = reply.result['mode'];
  if (activated !== true || typeof mode !== 'string' || !MODE_PATTERN.test(mode)) {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  const profileLabel = reply.result['profileLabel'];
  if (profileLabel !== undefined) {
    if (typeof profileLabel !== 'string' || profileLabel.length === 0) {
      throw createClientError({ code: 'invalid_payload', retryable: false });
    }
    return {
      activated: true,
      mode,
      profileLabel,
      revision: reply.revision
    };
  }
  return {
    activated: true,
    mode,
    revision: reply.revision
  };
}

async function runActivateProfile(
  deps: {
    readonly connection: ConnectionSession;
    readonly scheduler: Scheduler;
    readonly getGrantedCapabilities: () => readonly CapabilityId[];
  },
  input: {
    readonly profileRef: string;
    readonly expectedRevision: number;
  }
): Promise<ActivateProfileResult> {
  const notReady = guardReady(deps.connection);
  if (notReady !== undefined) {
    return Promise.reject(notReady);
  }
  const missingCap = guardCapability(
    deps.getGrantedCapabilities(),
    'account.activate'
  );
  if (missingCap !== undefined) {
    return Promise.reject(missingCap);
  }
  const identity = requireWireIdentity(deps.connection);
  if ('code' in identity) {
    return Promise.reject(identity);
  }
  const requestId = crypto.randomUUID();
  const result = await deps.connection.request({
    requestId,
    commandType: 'account:activate-profile',
    body: buildAccountActivateProfileBody(
      {
        requestId,
        serverInstanceId: identity.serverInstanceId,
        sessionEpoch: identity.sessionEpoch,
        occurredAtMs: deps.scheduler.now()
      },
      input
    )
  });
  if (!result.ok || !result.reply.ok) {
    return Promise.reject(mapReplyFailure(result));
  }
  return readActivateProfileResult(result.reply);
}

export function createAccountActivateCommandApi(deps: {
  readonly connection: ConnectionSession;
  readonly scheduler: Scheduler;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
}): AccountActivateCommandApi {
  return {
    activateProfile: (input) => runActivateProfile(deps, input)
  };
}
