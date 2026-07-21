/**
 * Capability-gated call mutation runner (SDK-06).
 */

import type { CapabilityId, CommandType } from '@axata/axatalk-protocol';

import {
  buildCallControlBody,
  buildCallOriginateBody,
  buildCallSendDtmfBody
} from './call-wire.js';
import type { ConnectionSession } from './connection-session.js';
import {
  guardCapability,
  guardReady,
  mapReplyFailure,
  readCallMutationResult,
  requireWireIdentity
} from './product-commands.js';
import type { Scheduler } from './scheduler.js';

export type CallMutationResult = {
  readonly callId: string;
  readonly revision: number;
};

export type CallControlType =
  | 'call:answer'
  | 'call:reject'
  | 'call:hangup'
  | 'call:hold'
  | 'call:resume'
  | 'call:mute'
  | 'call:unmute';

export type CallCommandApi = {
  readonly originateCall: (input: {
    readonly destination: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
  readonly controlCall: (
    type: CallControlType,
    input: { readonly callId: string; readonly expectedRevision: number }
  ) => Promise<CallMutationResult>;
  readonly sendDtmf: (input: {
    readonly callId: string;
    readonly digits: string;
    readonly expectedRevision: number;
  }) => Promise<CallMutationResult>;
};

export function createCallCommandApi(deps: {
  readonly connection: ConnectionSession;
  readonly scheduler: Scheduler;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
}): CallCommandApi {
  const runCallMutation = async (
    commandType: CommandType,
    capability: CapabilityId,
    buildBody: (fields: {
      readonly requestId: string;
      readonly serverInstanceId: string;
      readonly sessionEpoch: string;
      readonly occurredAtMs: number;
    }) => string
  ): Promise<CallMutationResult> => {
    const notReady = guardReady(deps.connection);
    if (notReady !== undefined) {
      return Promise.reject(notReady);
    }
    const missingCap = guardCapability(
      deps.getGrantedCapabilities(),
      capability
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
    return readCallMutationResult(result.reply);
  };

  return {
    originateCall: (input) =>
      runCallMutation('call:originate', 'call.originate', (fields) =>
        buildCallOriginateBody(fields, input)
      ),
    controlCall: (type, input) =>
      runCallMutation(type, 'call.control', (fields) =>
        buildCallControlBody(type, fields, input)
      ),
    sendDtmf: (input) =>
      runCallMutation('call:send-dtmf', 'call.control', (fields) =>
        buildCallSendDtmfBody(fields, input)
      )
  };
}
