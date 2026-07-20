/**
 * Capability-gated account logout command runner (SDK-07).
 */

import type { CapabilityId, CommandType } from '@axatalk/protocol';

import {
  buildAccountConfirmLogoutBody,
  buildAccountPrepareLogoutBody
} from './account-logout-wire.js';
import { createClientError } from './client-errors.js';
import type { ConnectionSession } from './connection-session.js';
import {
  guardCapability,
  guardReady,
  mapReplyFailure,
  requireWireIdentity
} from './product-commands.js';
import type { Scheduler } from './scheduler.js';

/** Successful prepare-logout (no interaction required). @public */
export type PrepareLogoutResult = {
  readonly logoutToken: string;
  readonly requiresReason: boolean;
  readonly revision: number;
};

/** Successful confirm-logout. @public */
export type ConfirmLogoutResult = {
  readonly loggedOut: boolean;
  readonly revision: number;
};

export type AccountLogoutCommandApi = {
  readonly prepareLogout: (input: {
    readonly expectedRevision: number;
  }) => Promise<PrepareLogoutResult>;
  readonly confirmLogout: (input: {
    readonly logoutToken: string;
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }) => Promise<ConfirmLogoutResult>;
};

function readPrepareLogoutResult(reply: {
  readonly revision: number;
  readonly result: Readonly<Record<string, unknown>>;
}): PrepareLogoutResult {
  const logoutToken = reply.result['logoutToken'];
  const requiresReason = reply.result['requiresReason'];
  if (
    typeof logoutToken !== 'string' ||
    logoutToken.length === 0 ||
    typeof requiresReason !== 'boolean'
  ) {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  return {
    logoutToken,
    requiresReason,
    revision: reply.revision
  };
}

function readConfirmLogoutResult(reply: {
  readonly revision: number;
  readonly result: Readonly<Record<string, unknown>>;
}): ConfirmLogoutResult {
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
  const runLogoutCommand = async <T>(
    commandType: CommandType,
    buildBody: (fields: {
      readonly requestId: string;
      readonly serverInstanceId: string;
      readonly sessionEpoch: string;
      readonly occurredAtMs: number;
    }) => string,
    readResult: (reply: {
      readonly revision: number;
      readonly result: Readonly<Record<string, unknown>>;
    }) => T
  ): Promise<T> => {
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
      commandType,
      body: buildBody(fields)
    });
    if (!result.ok || !result.reply.ok) {
      return Promise.reject(mapReplyFailure(result));
    }
    return readResult(result.reply);
  };

  return {
    prepareLogout: (input) =>
      runLogoutCommand(
        'account:prepare-logout',
        (fields) => buildAccountPrepareLogoutBody(fields, input),
        readPrepareLogoutResult
      ),
    confirmLogout: (input) =>
      runLogoutCommand(
        'account:confirm-logout',
        (fields) => buildAccountConfirmLogoutBody(fields, input),
        readConfirmLogoutResult
      )
  };
}
