/**
 * - Purpose: bridge Telephony domain events to OCP call sync + queue context.
 * - Inputs: Incoming/Outgoing/Requested/Answered/Ended/Failed events + OCP calls entity.
 * - Outputs: get_main_acallid / dlg_stop + CallOcpContextProjection updates via hub.
 */

import type { DomainEvent } from "@domain/index.js";
import {
  createCallOcpContextResolvedEvent,
  type CallOcpContextResolvedPhase,
} from "@domain/integration/ocp/events/CallOcpContextResolved.js";
import type {
  OcpCallsPayload,
  OcpIncomingMessage,
  OcpMainCallIdInfoPayload,
} from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type {
  CallOcpContextAcdWire,
  CallOcpContextDirection,
} from "../../projections/integration/callOcpContextProjection.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";
/** Hide forever-pending queue badge when OCP does not answer with MainCallIDInfo. */
const QUEUE_RESOLVE_TIMEOUT_MS = 5_000;

/** Legacy SIP lifecycle names expected by OCP `get_main_acallid` wire `event`. */
const OCP_LIFECYCLE_EVENT = {
  incomingProgress: "incomingCallProgress",
  outgoingProgress: "outgoingCallProgress",
  incomingAccepted: "incomingCallAccepted",
  outgoingAccepted: "outgoingCallAccepted",
} as const;

export type OcpTelephonyBridgeCallContextPort = Readonly<{
  markPending: (callId: string, direction: CallOcpContextDirection) => void;
  resolve: (
    callId: string,
    input: Readonly<{
      acallId: string;
      queueName: string | null;
      acdWire: CallOcpContextAcdWire;
    }>,
  ) => void;
  markUnavailable: (callId: string) => void;
  clear: (callId: string) => void;
}>;

export type OcpTelephonyBridgeServiceDeps = Readonly<{
  eventPublisher: DomainEventPublisher;
  ocpGateway: OcpGateway;
  isOcpAuthenticated: () => boolean;
  /**
   * OCP connect login from session projection (wire `user_login`).
   * Null/empty → skip get_main_acallid (no silent wrong payload).
   */
  getOcpUserLogin: () => string | null;
  logger: Logger;
  callContext: OcpTelephonyBridgeCallContextPort;
  /** Clear preview/progressive campaign slots when a SIP call ends (legacy parity). */
  clearCampaignOnCallTerminal: () => void;
}>;

export class OcpTelephonyBridgeService {
  private readonly unsubscribers: Array<() => void> = [];
  private readonly callCorrelationMap = new Map<string, string>();
  private readonly callDirectionMap = new Map<string, CallOcpContextDirection>();
  /** Remote party for wire caller_id/called_id (from domain phoneNumber). */
  private readonly remotePartyByCallId = new Map<string, string>();
  /** Last OCP lifecycle wire event name per call (for SDK phase). */
  private readonly lifecycleEventByCallId = new Map<string, string>();
  /** Last queueLabel published to Domain/SDK per call — avoid duplicate fan-out. */
  private readonly publishedQueueByCallId = new Map<string, string>();
  private readonly pendingTimeouts = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private pendingCorrelationCallId: string | null = null;

  constructor(private readonly deps: OcpTelephonyBridgeServiceDeps) {
    this.unsubscribers.push(
      deps.eventPublisher.subscribe((event) => {
        this.handleDomainEvent(event);
      }),
    );
    this.unsubscribers.push(
      deps.ocpGateway.onMessage((message) => {
        this.handleOcpMessage(message);
      }),
    );
  }

  getCorrelationAcallId(callId: string): string | undefined {
    return this.callCorrelationMap.get(callId);
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers.length = 0;
    for (const timer of this.pendingTimeouts.values()) {
      clearTimeout(timer);
    }
    this.pendingTimeouts.clear();
    this.callCorrelationMap.clear();
    this.callDirectionMap.clear();
    this.remotePartyByCallId.clear();
    this.lifecycleEventByCallId.clear();
    this.publishedQueueByCallId.clear();
    this.pendingCorrelationCallId = null;
  }

  private handleDomainEvent(event: DomainEvent): void {
    if (!this.deps.isOcpAuthenticated()) {
      return;
    }

    switch (event.type) {
      case "OutgoingCallRequested": {
        // Cache remote before OutgoingCallStarted so caller/called parties are ready.
        this.rememberRemoteParty(readCallId(event), readPhoneNumber(event));
        return;
      }
      case "IncomingCallReceived": {
        const callId = readCallId(event);
        this.rememberRemoteParty(callId, readPhoneNumber(event));
        this.requestMainAcallId(
          callId,
          "incoming",
          OCP_LIFECYCLE_EVENT.incomingProgress,
        );
        return;
      }
      case "OutgoingCallStarted": {
        const callId = readCallId(event);
        this.requestMainAcallId(
          callId,
          "outgoing",
          OCP_LIFECYCLE_EVENT.outgoingProgress,
        );
        return;
      }
      case "CallAnswered": {
        // Soft refresh correlation — do not flip resolved queue badge back to pending.
        this.refreshMainAcallId(readCallId(event));
        return;
      }
      case "CallEnded":
      case "CallFailed":
        this.sendDlgStop(readCallId(event));
        this.deps.clearCampaignOnCallTerminal();
        return;
      default:
        return;
    }
  }

  private handleOcpMessage(message: OcpIncomingMessage): void {
    if (message.entity !== "calls") {
      return;
    }
    const acallId = message.data.acallId;
    const pendingCallId = this.pendingCorrelationCallId;
    if (pendingCallId === null || acallId.length === 0) {
      return;
    }
    this.callCorrelationMap.set(pendingCallId, acallId);
    this.pendingCorrelationCallId = null;
    this.clearPendingTimeout(pendingCallId);

    if (!isMainCallIdInfo(message.data)) {
      return;
    }
    const localPartyLabel = this.deps.getOcpUserLogin()?.trim();
    if (localPartyLabel === undefined || localPartyLabel.length === 0) {
      return;
    }
    const phase = mapLifecycleEventToPhase(
      this.lifecycleEventByCallId.get(pendingCallId),
    );
    const queueName = readQueueName(message.data);
    const acdWire: CallOcpContextAcdWire = {
      ...(message.data.mainAcallId !== undefined
        ? { mainAcallId: message.data.mainAcallId }
        : {}),
      acallId: message.data.acallId,
      event: message.data.event,
      callerId: message.data.callerId,
      calledId: message.data.calledId,
      queue: message.data.queue,
      userLogin: localPartyLabel,
      phase,
    };
    this.deps.callContext.resolve(pendingCallId, {
      acallId,
      queueName,
      acdWire,
    });
    this.publishAcdContextIfNeeded(pendingCallId, message.data, acdWire);
  }

  private publishAcdContextIfNeeded(
    callId: string,
    data: OcpMainCallIdInfoPayload,
    acdWire: CallOcpContextAcdWire,
  ): void {
    const wireKey = [
      data.acallId,
      data.event,
      data.queue,
      data.mainAcallId ?? "",
    ].join("|");
    if (this.publishedQueueByCallId.get(callId) === wireKey) {
      return;
    }
    const direction = this.callDirectionMap.get(callId) ?? "incoming";
    const queueName = readQueueName(data) ?? "";
    this.publishedQueueByCallId.set(callId, wireKey);
    this.deps.eventPublisher.publish(
      createCallOcpContextResolvedEvent(createCorrelationId(), {
        callId,
        direction,
        queueName,
        phase: acdWire.phase,
        localPartyLabel: acdWire.userLogin,
        ocp: {
          ...(acdWire.mainAcallId !== undefined
            ? { mainAcallId: acdWire.mainAcallId }
            : {}),
          acallId: acdWire.acallId,
          event: acdWire.event,
          callerId: acdWire.callerId,
          calledId: acdWire.calledId,
          queue: acdWire.queue,
        },
      }),
    );
  }

  private requestMainAcallId(
    callId: string | null,
    direction: CallOcpContextDirection,
    lifecycleEvent: string,
  ): void {
    if (callId === null) {
      return;
    }
    this.pendingCorrelationCallId = callId;
    this.callDirectionMap.set(callId, direction);
    this.lifecycleEventByCallId.set(callId, lifecycleEvent);
    this.deps.callContext.markPending(callId, direction);
    this.armPendingTimeout(callId);
    this.sendGetMainAcallId(callId, lifecycleEvent);
  }

  private refreshMainAcallId(callId: string | null): void {
    if (callId === null) {
      return;
    }
    this.pendingCorrelationCallId = callId;
    const direction = this.callDirectionMap.get(callId) ?? "incoming";
    const lifecycleEvent =
      direction === "outgoing"
        ? OCP_LIFECYCLE_EVENT.outgoingAccepted
        : OCP_LIFECYCLE_EVENT.incomingAccepted;
    this.lifecycleEventByCallId.set(callId, lifecycleEvent);
    this.sendGetMainAcallId(callId, lifecycleEvent);
  }

  private sendGetMainAcallId(callId: string, lifecycleEvent: string): void {
    const userLogin = this.deps.getOcpUserLogin()?.trim() ?? "";
    if (userLogin.length === 0) {
      this.abortGetMainAcallId(callId, "login_required");
      return;
    }
    const parties = this.resolveCallParties(callId, userLogin);
    if (parties === null) {
      this.abortGetMainAcallId(callId, "remote_party_required");
      return;
    }
    const trimmedEvent = lifecycleEvent.trim();
    if (trimmedEvent.length === 0) {
      this.abortGetMainAcallId(callId, "lifecycle_event_required");
      return;
    }
    const result = this.deps.ocpGateway.sendCommand({
      kind: "get_main_acallid",
      callId,
      userLogin,
      callerId: parties.callerId,
      calledId: parties.calledId,
      lifecycleEvent: trimmedEvent,
    });
    if (!result.ok) {
      this.abortGetMainAcallId(callId, result.error.code);
    }
  }

  private abortGetMainAcallId(callId: string, result: string): void {
    this.deps.callContext.markUnavailable(callId);
    this.clearPendingTimeout(callId);
    if (this.pendingCorrelationCallId === callId) {
      this.pendingCorrelationCallId = null;
    }
    this.deps.logger.warn("ocp_telephony_bridge_get_main_acallid_failed", {
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "get_main_acallid",
      callId,
      result,
    });
  }

  private rememberRemoteParty(
    callId: string | null,
    phoneNumber: string | null,
  ): void {
    if (callId === null || phoneNumber === null) {
      return;
    }
    this.remotePartyByCallId.set(callId, phoneNumber);
  }

  private resolveCallParties(
    callId: string,
    userLogin: string,
  ): Readonly<{ callerId: string; calledId: string }> | null {
    const remote = this.remotePartyByCallId.get(callId)?.trim() ?? "";
    if (remote.length === 0) {
      return null;
    }
    const direction = this.callDirectionMap.get(callId) ?? "incoming";
    if (direction === "outgoing") {
      return { callerId: userLogin, calledId: remote };
    }
    return { callerId: remote, calledId: userLogin };
  }

  private sendDlgStop(callId: string | null): void {
    if (callId === null) {
      return;
    }
    const acallId = this.callCorrelationMap.get(callId);
    const result = this.deps.ocpGateway.sendCommand({
      kind: "dlg_stop",
      callId,
      ...(acallId !== undefined ? { acallId } : {}),
    });
    this.callCorrelationMap.delete(callId);
    this.callDirectionMap.delete(callId);
    this.remotePartyByCallId.delete(callId);
    this.lifecycleEventByCallId.delete(callId);
    this.publishedQueueByCallId.delete(callId);
    if (this.pendingCorrelationCallId === callId) {
      this.pendingCorrelationCallId = null;
    }
    this.clearPendingTimeout(callId);
    this.deps.callContext.clear(callId);
    if (!result.ok) {
      this.deps.logger.warn("ocp_telephony_bridge_dlg_stop_failed", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "dlg_stop",
        callId,
        result: result.error.code,
      });
    }
  }

  private armPendingTimeout(callId: string): void {
    this.clearPendingTimeout(callId);
    const timer = setTimeout(() => {
      this.pendingTimeouts.delete(callId);
      this.deps.callContext.markUnavailable(callId);
    }, QUEUE_RESOLVE_TIMEOUT_MS);
    this.pendingTimeouts.set(callId, timer);
  }

  private clearPendingTimeout(callId: string): void {
    const timer = this.pendingTimeouts.get(callId);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.pendingTimeouts.delete(callId);
    }
  }
}

function readCallId(event: DomainEvent): string | null {
  const callId = event["callId"];
  return typeof callId === "string" && callId.length > 0 ? callId : null;
}

function readPhoneNumber(event: DomainEvent): string | null {
  const phoneNumber = event["phoneNumber"];
  return typeof phoneNumber === "string" && phoneNumber.trim().length > 0
    ? phoneNumber.trim()
    : null;
}

function mapLifecycleEventToPhase(
  lifecycleEvent: string | undefined,
): CallOcpContextResolvedPhase {
  if (
    lifecycleEvent === OCP_LIFECYCLE_EVENT.incomingAccepted ||
    lifecycleEvent === OCP_LIFECYCLE_EVENT.outgoingAccepted
  ) {
    return "accepted";
  }
  return "progress";
}

function isMainCallIdInfo(
  data: OcpCallsPayload,
): data is OcpMainCallIdInfoPayload {
  return "event" in data && "queue" in data;
}

function readQueueName(data: OcpCallsPayload): string | null {
  if (!isMainCallIdInfo(data)) {
    return null;
  }
  const trimmed = data.queue.trim();
  return trimmed.length > 0 ? trimmed : null;
}
