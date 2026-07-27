/**
 * Capability-gated operator command runner (SDK-07 + finish-appeal).
 */

import type {
  CapabilityId,
  CommandType,
  PublicOperatorStatus
} from '@axata/axatalk-protocol';
import { PublicOperatorStatusSchema } from '@axata/axatalk-protocol';

import { createClientError } from './client-errors.js';
import type { ConnectionSession } from './connection-session.js';
import {
  buildOperatorChangeStatusBody,
  buildOperatorFinishAppealBody,
  buildOperatorGetReasonsBody
} from './operator-wire.js';
import {
  guardCapability,
  guardReady,
  mapReplyFailure,
  requireWireIdentity
} from './product-commands.js';
import type { Scheduler } from './scheduler.js';

/** Public operator reason DTO (protocol-safe; no OCP wire). @public */
export type OperatorReason = {
  readonly id: number;
  readonly label: string;
  readonly kind: 'ready' | 'break' | 'logout';
};

/** @public */
export type OperatorReasonsResult = {
  readonly reasons: readonly OperatorReason[];
  readonly revision: number;
};

/** Outcome of `operator:change-status` / finish-appeal success. @public */
export type OperatorStatusChangeKind = 'applied' | 'reserved';

/** @public */
export type OperatorStatusChangeResult = {
  readonly accepted: true;
  readonly kind: OperatorStatusChangeKind;
  readonly targetStatus: PublicOperatorStatus;
  readonly reasonId: number;
  readonly revision: number;
};

/** Finish-appeal success reuses the same public shape as applied change-status. @public */
export type OperatorFinishAppealResult = OperatorStatusChangeResult;

export type OperatorCommandApi = {
  readonly getReasons: () => Promise<OperatorReasonsResult>;
  readonly changeStatus: (input: {
    readonly target: 'ready' | 'break';
    readonly reasonId?: number;
    readonly expectedRevision: number;
  }) => Promise<OperatorStatusChangeResult>;
  readonly finishAppeal: (input: {
    readonly expectedRevision: number;
  }) => Promise<OperatorFinishAppealResult>;
};

function readOperatorReasons(reply: {
  readonly revision: number;
  readonly result: Readonly<Record<string, unknown>>;
}): OperatorReasonsResult {
  const raw = reply.result['reasons'];
  if (!Array.isArray(raw)) {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  const reasons: OperatorReason[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      throw createClientError({ code: 'invalid_payload', retryable: false });
    }
    const record = item as Record<string, unknown>;
    const id = record['id'];
    const label = record['label'];
    const kind = record['kind'];
    if (
      typeof id !== 'number' ||
      !Number.isInteger(id) ||
      id < 0 ||
      typeof label !== 'string' ||
      label.length === 0 ||
      (kind !== 'ready' && kind !== 'break' && kind !== 'logout')
    ) {
      throw createClientError({ code: 'invalid_payload', retryable: false });
    }
    reasons.push({ id, label, kind });
  }
  return { reasons, revision: reply.revision };
}

function readStatusChangeResult(reply: {
  readonly revision: number;
  readonly result: Readonly<Record<string, unknown>>;
}): OperatorStatusChangeResult {
  const accepted = reply.result['accepted'];
  const kind = reply.result['kind'];
  const targetStatusRaw = reply.result['targetStatus'];
  const reasonId = reply.result['reasonId'];
  const statusParsed = PublicOperatorStatusSchema.safeParse(targetStatusRaw);
  if (
    accepted !== true ||
    (kind !== 'applied' && kind !== 'reserved') ||
    !statusParsed.success ||
    typeof reasonId !== 'number' ||
    !Number.isInteger(reasonId) ||
    reasonId < 0
  ) {
    throw createClientError({ code: 'invalid_payload', retryable: false });
  }
  return {
    accepted: true,
    kind,
    targetStatus: statusParsed.data,
    reasonId,
    revision: reply.revision
  };
}

export function createOperatorCommandApi(deps: {
  readonly connection: ConnectionSession;
  readonly scheduler: Scheduler;
  readonly getGrantedCapabilities: () => readonly CapabilityId[];
}): OperatorCommandApi {
  const runOperatorCommand = async <T>(
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
      'operator.status.write'
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
    getReasons: () =>
      runOperatorCommand(
        'operator:get-reasons',
        (fields) => buildOperatorGetReasonsBody(fields),
        readOperatorReasons
      ),
    changeStatus: (input) =>
      runOperatorCommand(
        'operator:change-status',
        (fields) => buildOperatorChangeStatusBody(fields, input),
        readStatusChangeResult
      ),
    finishAppeal: (input) =>
      runOperatorCommand(
        'operator:finish-appeal',
        (fields) => buildOperatorFinishAppealBody(fields, input),
        readStatusChangeResult
      )
  };
}
