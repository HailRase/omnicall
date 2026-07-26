/**
 * - Purpose: bridge Telephony domain events to OCP call sync + queue context.
 * - Inputs: Incoming/Outgoing/Answered/Ended/Failed events + OCP calls entity.
 * - Outputs: get_main_acallid / dlg_stop + CallOcpContextProjection updates via hub.
 */

import type { DomainEvent } from "@domain/index.js";
import { createCallOcpContextResolvedEvent } from "@domain/integration/ocp/events/CallOcpContextResolved.js";
import type {
  OcpCallsPayload,
  OcpIncomingMessage,
  OcpMainCallIdInfoPayload,
} from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CallOcpContextDirection } from "../../projections/integration/callOcpContextProjection.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";
/** Hide forever-pending queue badge when OCP does not answer with MainCallIDInfo. */
const QUEUE_RESOLVE_TIMEOUT_MS = 5_000;

export type OcpTelephonyBridgeCallContextPort = Readonly<{
  markPending: (callId: string, direction: CallOcpContextDirection) => void;
  resolve: (
    callId: string,
    input: Readonly<{ acallId: string; queueName: string | null }>,
  ) => void;
  markUnavailable: (callId: string) => void;
  clear: (callId: string) => void;
}>;

export type OcpTelephonyBridgeServiceDeps = Readonly<{
  eventPublisher: DomainEventPublisher;
  ocpGateway: OcpGateway;
  isOcpAuthenticated: () => boolean;
  logger: Logger;
  callContext: OcpTelephonyBridgeCallContextPort;
  /** Clear preview/progressive campaign slots when a SIP call ends (legacy parity). */
  clearCampaignOnCallTerminal: () => void;
}>;

export class OcpTelephonyBridgeService {
  private readonly unsubscribers: Array<() => void> = [];
  private readonly callCorrelationMap = new Map<string, string>();
  private readonly callDirectionMap = new Map<string, CallOcpContextDirection>();
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
    this.publishedQueueByCallId.clear();
    this.pendingCorrelationCallId = null;
  }

  private handleDomainEvent(event: DomainEvent): void {
    if (!this.deps.isOcpAuthenticated()) {
      return;
    }

    switch (event.type) {
      case "IncomingCallReceived": {
        const callId = readCallId(event);
        this.requestMainAcallId(callId, "incoming");
        return;
      }
      case "OutgoingCallStarted": {
        const callId = readCallId(event);
        this.requestMainAcallId(callId, "outgoing");
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

    const queueName = readQueueName(message.data);
    this.deps.callContext.resolve(pendingCallId, { acallId, queueName });
    this.publishQueueResolvedIfNeeded(pendingCallId, queueName);
  }

  private publishQueueResolvedIfNeeded(
    callId: string,
    queueName: string | null,
  ): void {
    if (queueName === null) {
      return;
    }
    if (this.publishedQueueByCallId.get(callId) === queueName) {
      return;
    }
    const direction = this.callDirectionMap.get(callId) ?? "incoming";
    this.publishedQueueByCallId.set(callId, queueName);
    this.deps.eventPublisher.publish(
      createCallOcpContextResolvedEvent(createCorrelationId(), {
        callId,
        direction,
        queueName,
      }),
    );
  }

  private requestMainAcallId(
    callId: string | null,
    direction: CallOcpContextDirection,
  ): void {
    if (callId === null) {
      return;
    }
    this.pendingCorrelationCallId = callId;
    this.callDirectionMap.set(callId, direction);
    this.deps.callContext.markPending(callId, direction);
    this.armPendingTimeout(callId);
    this.sendGetMainAcallId(callId);
  }

  private refreshMainAcallId(callId: string | null): void {
    if (callId === null) {
      return;
    }
    this.pendingCorrelationCallId = callId;
    this.sendGetMainAcallId(callId);
  }

  private sendGetMainAcallId(callId: string): void {
    const result = this.deps.ocpGateway.sendCommand({
      kind: "get_main_acallid",
      callId,
    });
    if (!result.ok) {
      this.deps.callContext.markUnavailable(callId);
      this.clearPendingTimeout(callId);
      this.deps.logger.warn("ocp_telephony_bridge_get_main_acallid_failed", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "get_main_acallid",
        callId,
        result: result.error.code,
      });
    }
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
