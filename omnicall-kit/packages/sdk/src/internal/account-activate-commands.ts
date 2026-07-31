/**
 * Capability-gated saved-profile activation runner (SDK-08).
 * Privileged `account.activate` — server-granted only; never pairing-default.
 */

import type { CapabilityId } from '@softomnitel/omnicall-protocol';
import { SDK_ACTIVATE_CLIENT_TIMEOUT_MS } from '@softomnitel/omnicall-protocol';

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

/** Documented activate modes accepted by protocol v1 desktop. @public */
export type ActivateProfileMode = 'sip_only' | 'ocp';

/** Successful activate-profile. @public */
export type ActivateProfileResult = {
  readonly activated: true;
  readonly mode: ActivateProfileMode;
  readonly profileLabel?: string;
  readonly alreadyAuthenticated?: boolean;
  readonly revision: number;
};

export type AccountActivateCommandApi = {
  readonly activateProfile: (input: {
    readonly login: string;
    readonly expectedRevision: number;
    readonly mode?: ActivateProfileMode;
  }) => Promise<ActivateProfileResult>;
};

function isActivateProfileMode(value: string): value is ActivateProfileMode {
  return value === 'sip_only' || value === 'ocp';
}

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
  if (
    activated !== true ||
    typeof mode !== 'string' ||
    !isActivateProfileMode(mode)
  ) {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  const profileLabel = reply.result['profileLabel'];
  const alreadyAuthenticated = reply.result['alreadyAuthenticated'];
  if (profileLabel !== undefined) {
    if (typeof profileLabel !== 'string' || profileLabel.length === 0) {
      throw createClientError({ code: 'invalid_payload', retryable: false });
    }
  }
  if (
    alreadyAuthenticated !== undefined &&
    typeof alreadyAuthenticated !== 'boolean'
  ) {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  return {
    activated: true,
    mode,
    ...(profileLabel === undefined ? {} : { profileLabel }),
    ...(alreadyAuthenticated === undefined ? {} : { alreadyAuthenticated }),
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
    readonly login: string;
    readonly expectedRevision: number;
    readonly mode?: ActivateProfileMode;
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
    timeoutMs: SDK_ACTIVATE_CLIENT_TIMEOUT_MS,
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
