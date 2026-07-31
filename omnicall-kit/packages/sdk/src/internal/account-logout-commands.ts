/**
 * Capability-gated single-shot account logout (session.logout).
 */

import type { CapabilityId, CommandType } from '@softomnitel/omnicall-protocol';

import { buildAccountLogoutBody } from './account-logout-wire.js';
import { createClientError } from './client-errors.js';
import type { ConnectionSession } from './connection-session.js';
import {
  guardCapability,
  guardReady,
  mapReplyFailure,
  requireWireIdentity
} from './product-commands.js';
import type { Scheduler } from './scheduler.js';

/** Successful account:logout. @public */
export type LogoutResult = {
  readonly loggedOut: true;
  readonly revision: number;
};

export type AccountLogoutCommandApi = {
  readonly logout: (input: {
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }) => Promise<LogoutResult>;
};

function readLogoutResult(reply: {
  readonly revision: number;
  readonly result: Readonly<Record<string, unknown>>;
}): LogoutResult {
  const loggedOut = reply.result['loggedOut'];
  if (loggedOut !== true) {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  return {
    loggedOut: true,
    revision: reply.revision
  };
}

export function createAccountLogoutCommandApi(deps: {
  readonly connection: ConnectionSession;
  readonly scheduler: Scheduler;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
}): AccountLogoutCommandApi {
  return {
    logout: async (input) => {
      const notReady = guardReady(deps.connection);
      if (notReady !== undefined) {
        return Promise.reject(notReady);
      }
      const missingCap = guardCapability(
        deps.getGrantedCapabilities(),
        'session.logout'
      );
      if (missingCap !== undefined) {
        return Promise.reject(missingCap);
      }
      const identity = requireWireIdentity(deps.connection);
      if ('code' in identity) {
        return Promise.reject(identity);
      }
      const requestId = crypto.randomUUID();
      const fields = {
        requestId,
        serverInstanceId: identity.serverInstanceId,
        sessionEpoch: identity.sessionEpoch,
        occurredAtMs: deps.scheduler.now()
      };
      const result = await deps.connection.request({
        requestId,
        commandType: 'account:logout' satisfies CommandType,
        body: buildAccountLogoutBody(fields, input)
      });
      if (!result.ok || !result.reply.ok) {
        return Promise.reject(mapReplyFailure(result));
      }
      return readLogoutResult(result.reply);
    }
  };
}
