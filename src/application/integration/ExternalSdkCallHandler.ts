/**
 * Application call-command handler (DI-06 / ADR-0017 / ADR-0021 / ADR-0027).
 * Aggregate revision via SdkSessionRevisionCoordinator; nested per-call mutex.
 * Ownership is informational (snapshot); control is capability-gated for any
 * authenticated paired client (shared desk — no cross-client not_owner deny).
 */

import type { CommandMessage } from "@softomnitel/omnicall-protocol";
import {
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateWireMessage,
} from "@softomnitel/omnicall-protocol";
import { createCallId, type CallId } from "@domain/index.js";
import type {
  ExternalCommandContext,
  ExternalCommandHandler,
  ExternalHandlerResult,
} from "@ports/integration/ExternalCommandHandler.js";

import type { ExternalSdkCallPort } from "./ExternalSdkCallPort.js";
import {
  mapPlatformErrorToSdkFailure,
  mapUcResultToSdk,
  readStringField,
  sdkFail,
} from "./externalSdkCallHelpers.js";
import { SdkAggregateMutex } from "./SdkAggregateMutex.js";
import type { SdkCallOwnershipRegistry } from "./SdkCallOwnershipRegistry.js";
import type {
  SdkRevisionMutationOutcome,
  SdkSessionRevisionCoordinator,
} from "./SdkSessionRevisionCoordinator.js";

const CALL_COMMAND_TYPES = new Set<string>([
  "call:originate",
  "call:answer",
  "call:reject",
  "call:hangup",
  "call:hold",
  "call:resume",
  "call:mute",
  "call:unmute",
  "call:send-dtmf",
]);

const IDEMPOTENCY_TTL_MS = 120_000;

export type ExternalSdkCallHandlerOptions = Readonly<{
  callPort: ExternalSdkCallPort;
  ownership: SdkCallOwnershipRegistry;
  revisionCoordinator: SdkSessionRevisionCoordinator;
  /** Nested per-call serialization (acquired inside aggregate lock). */
  mutex?: SdkAggregateMutex;
  nowMs?: () => number;
}>;

type CachedReply = Readonly<{
  result: ExternalHandlerResult;
  expiresAt: number;
}>;

/**
 * Focused call mutation surface for the single renderer composition.
 */
export class ExternalSdkCallHandler implements ExternalCommandHandler {
  private readonly callPort: ExternalSdkCallPort;
  private readonly ownership: SdkCallOwnershipRegistry;
  private readonly revisionCoordinator: SdkSessionRevisionCoordinator;
  private readonly mutex: SdkAggregateMutex;
  private readonly nowMs: () => number;
  private readonly idempotency = new Map<string, CachedReply>();
  private readonly inFlight = new Map<string, Promise<ExternalHandlerResult>>();

  constructor(options: ExternalSdkCallHandlerOptions) {
    this.callPort = options.callPort;
    this.ownership = options.ownership;
    this.revisionCoordinator = options.revisionCoordinator;
    this.mutex = options.mutex ?? new SdkAggregateMutex();
    this.nowMs = options.nowMs ?? (() => Date.now());
  }

  handlesCommandType(commandType: string): boolean {
    return CALL_COMMAND_TYPES.has(commandType);
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

    const requestId = this.idempotencyKey(message.requestId, context);
    this.pruneIdempotency();
    const cached = this.idempotency.get(requestId);
    if (cached !== undefined && cached.expiresAt > this.nowMs()) {
      return Promise.resolve(cached.result);
    }
    const pending = this.inFlight.get(requestId);
    if (pending !== undefined) {
      return pending;
    }

    const execution = this.executeCommand(message, context)
      .then((result) => {
        this.idempotency.set(requestId, {
          result,
          expiresAt: this.nowMs() + IDEMPOTENCY_TTL_MS,
        });
        return result;
      })
      .finally(() => {
        this.inFlight.delete(requestId);
      });
    this.inFlight.set(requestId, execution);
    return execution;
  }

  private async executeCommand(
    message: CommandMessage,
    context: ExternalCommandContext | undefined,
  ): Promise<ExternalHandlerResult> {
    const clientId = context?.clientId;
    if (clientId === undefined || clientId.length === 0) {
      return sdkFail("unauthenticated");
    }
    if (message.type === "call:originate") {
      return this.revisionCoordinator.runMutationFromPayload(
        message.payload,
        () => this.handleOriginate(message.payload, clientId),
      );
    }
    const callIdRaw = readStringField(message.payload, "callId");
    if (callIdRaw === null) {
      return sdkFail("invalid_payload");
    }
    // Aggregate lock first, then nested per-call lock (ADR-0027).
    return this.revisionCoordinator.runMutationFromPayload(
      message.payload,
      () =>
        this.mutex.runExclusive(callIdRaw, () =>
          this.handleControl(message.type, message.payload, clientId, callIdRaw),
        ),
    );
  }

  private async handleOriginate(
    payload: unknown,
    clientId: string,
  ): Promise<SdkRevisionMutationOutcome> {
    const destination = readStringField(payload, "destination");
    if (destination === null || destination.length === 0) {
      return sdkFail("invalid_payload");
    }
    const result = await this.callPort.makeCall(destination);
    if (!result.ok) {
      return mapPlatformErrorToSdkFailure(result.error);
    }
    const callId = String(result.value.id);
    this.ownership.assignOwner(callId, clientId);
    return { ok: true, result: { callId, accepted: true } };
  }

  private async handleControl(
    type: string,
    payload: unknown,
    clientId: string,
    callIdRaw: string,
  ): Promise<SdkRevisionMutationOutcome> {
    // ADR-0021: shared desk — any capability-authorized client may control.
    const callId = createCallId(callIdRaw);
    const ucResult = await this.invokeControl(type, callId, payload);
    if (!ucResult.ok) {
      return ucResult;
    }
    if (type === "call:answer") {
      const record = this.ownership.get(callIdRaw);
      if (record === undefined || record.terminal) {
        this.ownership.assignOwner(callIdRaw, clientId);
      }
    }
    if (type === "call:hangup" || type === "call:reject") {
      this.ownership.finalize(callIdRaw);
    }
    return { ok: true, result: { callId: callIdRaw, accepted: true } };
  }

  private async invokeControl(
    type: string,
    callId: CallId,
    payload: unknown,
  ): Promise<ExternalHandlerResult> {
    switch (type) {
      case "call:answer":
        return mapUcResultToSdk(await this.callPort.answerCall(callId));
      case "call:reject":
        return mapUcResultToSdk(await this.callPort.rejectCall(callId));
      case "call:hangup":
        return mapUcResultToSdk(await this.callPort.hangupCall(callId));
      case "call:hold":
        return mapUcResultToSdk(await this.callPort.holdCall(callId));
      case "call:resume":
        return mapUcResultToSdk(await this.callPort.resumeCall(callId));
      case "call:mute":
        return mapUcResultToSdk(await this.callPort.muteCall(callId));
      case "call:unmute":
        return mapUcResultToSdk(await this.callPort.unmuteCall(callId));
      case "call:send-dtmf":
        return this.sendDtmfDigits(callId, payload);
      default:
        return sdkFail("unsupported_command");
    }
  }

  private async sendDtmfDigits(
    callId: CallId,
    payload: unknown,
  ): Promise<ExternalHandlerResult> {
    const digits = readStringField(payload, "digits");
    if (digits === null || digits.length === 0) {
      return sdkFail("invalid_payload");
    }
    for (const tone of digits) {
      const result = await this.callPort.sendDtmf(callId, tone);
      if (!result.ok) {
        return mapPlatformErrorToSdkFailure(result.error);
      }
    }
    return { ok: true, result: {}, revision: 0 };
  }

  private pruneIdempotency(): void {
    const now = this.nowMs();
    for (const [id, entry] of this.idempotency) {
      if (entry.expiresAt <= now) {
        this.idempotency.delete(id);
      }
    }
  }

  private idempotencyKey(
    requestId: string,
    context: ExternalCommandContext | undefined,
  ): string {
    return `${context?.origin ?? ""}\u0000${context?.clientId ?? ""}\u0000${requestId}`;
  }
}

export function isSdkCallCommandType(type: string): boolean {
  return CALL_COMMAND_TYPES.has(type);
}
