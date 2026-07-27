/**
 * Application operator/logout/finish-appeal handler (DI-07 / ADR-0017 O-OCP-1).
 * Maps public protocol → F-028 Facade with callType "sdk". Reads peek-only.
 * Logout is single-shot `account:logout` (CRM supplies reasonId).
 * Finish appeal is `operator:finish-appeal` (OCP login + post-call processing only).
 */

import type { CommandMessage } from "@softomnitel/omnicall-protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@softomnitel/omnicall-protocol";
import type {
  ExternalCommandContext,
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";

import type { ExternalSdkOperatorPort } from "./ExternalSdkOperatorPort.js";
import {
  readExpectedRevision,
  sdkCallStale,
  sdkCallSuccess,
  sdkFail,
} from "./externalSdkCallHelpers.js";
import { logoutAccountCommand } from "./externalSdkLogoutCommands.js";
import {
  assertClientId,
  parseChangeStatusPayload,
  reasonToWire,
} from "./externalSdkOperatorHelpers.js";
import { mapPlatformErrorToSdkCode, isNotInPostCallProcessingError } from "./mapPlatformErrorToSdkCode.js";
import { resolveSdkStatusReasonId } from "./mapSdkOperatorReasons.js";
import { SdkAggregateMutex } from "./SdkAggregateMutex.js";
import type { SdkSessionRevisionClock } from "./SdkSessionRevisionClock.js";

const OPERATOR_COMMAND_TYPES = new Set<string>([
  "operator:get-reasons",
  "operator:change-status",
  "operator:finish-appeal",
  "account:logout",
]);

const ACCOUNT_LOCK_KEY = "__sdk_account__";
const IDEMPOTENCY_TTL_MS = 120_000;

export type ExternalSdkOperatorHandlerOptions = Readonly<{
  operatorPort: ExternalSdkOperatorPort;
  revisionClock: SdkSessionRevisionClock;
  mutex?: SdkAggregateMutex;
  nowMs?: () => number;
}>;

type CachedReply = Readonly<{
  result: ExternalHandlerResult;
  expiresAt: number;
}>;

/**
 * Focused operator/logout surface for the single renderer composition.
 */
export class ExternalSdkOperatorHandler implements ExternalCommandHandler {
  private readonly operatorPort: ExternalSdkOperatorPort;
  private readonly revisionClock: SdkSessionRevisionClock;
  private readonly mutex: SdkAggregateMutex;
  private readonly nowMs: () => number;
  private readonly idempotency = new Map<string, CachedReply>();
  private readonly inFlight = new Map<string, Promise<ExternalHandlerResult>>();

  constructor(options: ExternalSdkOperatorHandlerOptions) {
    this.operatorPort = options.operatorPort;
    this.revisionClock = options.revisionClock;
    this.mutex = options.mutex ?? new SdkAggregateMutex();
    this.nowMs = options.nowMs ?? (() => Date.now());
  }

  handlesCommandType(commandType: string): boolean {
    return OPERATOR_COMMAND_TYPES.has(commandType);
  }

  handleCommand(
    input: unknown,
    context?: ExternalCommandContext,
  ): Promise<ExternalHandlerResult> {
    const validated = validateWireMessage(input);
    if (!validated.success) {
      return Promise.resolve(sdkFail(validated.code));
    }
    const message = validated.data;
    if (message.kind !== "command") {
      return Promise.resolve(sdkFail("invalid_message"));
    }
    if (!isCommandAvailableInProductV1(message.type)) {
      const denial = productDenialCodeForCommand(message.type);
      return Promise.resolve(sdkFail(denial ?? "forbidden"));
    }
    if (!this.handlesCommandType(message.type)) {
      return Promise.resolve(sdkFail("unsupported_command"));
    }

    const requestId = message.requestId;
    this.pruneCaches();
    const cached = this.idempotency.get(requestId);
    if (cached !== undefined && cached.expiresAt > this.nowMs()) {
      return Promise.resolve(cached.result);
    }
    const pending = this.inFlight.get(requestId);
    if (pending !== undefined) {
      return pending;
    }

    const execution = this.executeCommand(message, context).then((result) => {
      this.idempotency.set(requestId, {
        result,
        expiresAt: this.nowMs() + IDEMPOTENCY_TTL_MS,
      });
      this.inFlight.delete(requestId);
      return result;
    });
    this.inFlight.set(requestId, execution);
    return execution;
  }

  private executeCommand(
    message: CommandMessage,
    context: ExternalCommandContext | undefined,
  ): Promise<ExternalHandlerResult> {
    const clientId = context?.clientId;
    const clientGate = assertClientId(clientId);
    if (clientGate !== null || clientId === undefined) {
      return Promise.resolve(clientGate ?? sdkFail("unauthenticated"));
    }
    if (message.type === "operator:get-reasons") {
      return Promise.resolve(this.handleGetReasons());
    }
    return this.mutex.runExclusive(ACCOUNT_LOCK_KEY, () =>
      this.handleMutation(message),
    );
  }

  private handleGetReasons(): ExternalHandlerResult {
    const reasons = this.operatorPort.listOperatorReasons();
    return sdkCallSuccess(
      { reasons: reasons.map(reasonToWire) },
      this.revisionClock.peek(),
    );
  }

  private handleMutation(
    message: CommandMessage,
  ): Promise<ExternalHandlerResult> {
    switch (message.type) {
      case "operator:change-status":
        return this.handleChangeStatus(message.payload);
      case "operator:finish-appeal":
        return this.handleFinishAppeal(message.payload);
      case "account:logout":
        return logoutAccountCommand(
          {
            operatorPort: this.operatorPort,
            revisionClock: this.revisionClock,
            requireFreshRevision: (payload: unknown) =>
              this.requireFreshRevision(payload),
          },
          message.payload,
        );
      default:
        return Promise.resolve(sdkFail("unsupported_command"));
    }
  }

  private async handleChangeStatus(
    payload: unknown,
  ): Promise<ExternalHandlerResult> {
    const gate = this.requireFreshRevision(payload);
    if (!gate.ok) {
      return gate;
    }
    const session = this.operatorPort.readOcpSession();
    if (!session.isAuthenticated || !session.hasOperatorSnapshot) {
      return sdkFail("not_found");
    }
    const parsed = parseChangeStatusPayload(payload);
    if (parsed === null) {
      return sdkFail("invalid_payload");
    }
    const reasonId = resolveSdkStatusReasonId(
      parsed.target,
      parsed.reasonId,
      this.operatorPort.listOperatorReasons(),
    );
    if (reasonId === null) {
      return sdkFail("invalid_payload");
    }
    const result = await this.operatorPort.changeOperatorStatus({
      targetStatus: parsed.target,
      reasonId,
    });
    if (!result.ok) {
      return sdkFail(mapPlatformErrorToSdkCode(result.error));
    }
    return sdkCallSuccess(
      {
        accepted: true,
        kind: result.value.kind,
        targetStatus: result.value.targetStatus,
        reasonId: result.value.reasonId,
      },
      this.revisionClock.advance(),
    );
  }

  private async handleFinishAppeal(
    payload: unknown,
  ): Promise<ExternalHandlerResult> {
    const gate = this.requireFreshRevision(payload);
    if (!gate.ok) {
      return gate;
    }
    const session = this.operatorPort.readOcpSession();
    if (!session.isAuthenticated || !session.hasOperatorSnapshot) {
      return sdkFail("not_found");
    }
    const result = await this.operatorPort.finishPostCallAppeal();
    if (!result.ok) {
      return sdkFail(mapPlatformErrorToSdkCode(result.error), {
        ...(isNotInPostCallProcessingError(result.error)
          ? { failure_kind: "not_in_post_call_processing" }
          : {}),
      });
    }
    return sdkCallSuccess(
      {
        accepted: true,
        kind: result.value.kind,
        targetStatus: result.value.targetStatus,
        reasonId: result.value.reasonId,
      },
      this.revisionClock.advance(),
    );
  }

  private requireFreshRevision(
    payload: unknown,
  ): ExternalHandlerResult | { readonly ok: true } {
    const expectedRevision = readExpectedRevision(payload);
    if (expectedRevision === null) {
      return sdkFail("invalid_payload");
    }
    const current = this.revisionClock.peek();
    if (expectedRevision !== current) {
      return sdkCallStale(current);
    }
    return { ok: true };
  }

  private pruneCaches(): void {
    const now = this.nowMs();
    for (const [id, entry] of this.idempotency) {
      if (entry.expiresAt <= now) {
        this.idempotency.delete(id);
      }
    }
  }
}

export function isSdkOperatorCommandType(type: string): boolean {
  return OPERATOR_COMMAND_TYPES.has(type);
}
