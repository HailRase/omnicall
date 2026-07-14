/**
 * - Purpose: bridge Telephony domain events to OCP call sync commands.
 * - Inputs: Incoming/Outgoing/Answered/Ended/Failed events + OCP calls entity.
 * - Outputs: get_main_acallid / dlg_stop gateway commands via correlation map.
 */

import type { DomainEvent } from "@domain/index.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

export type OcpTelephonyBridgeServiceDeps = Readonly<{
  eventPublisher: DomainEventPublisher;
  ocpGateway: OcpGateway;
  isOcpAuthenticated: () => boolean;
  logger: Logger;
}>;

export class OcpTelephonyBridgeService {
  private readonly unsubscribers: Array<() => void> = [];
  private readonly callCorrelationMap = new Map<string, string>();
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
    this.callCorrelationMap.clear();
    this.pendingCorrelationCallId = null;
  }

  private handleDomainEvent(event: DomainEvent): void {
    if (!this.deps.isOcpAuthenticated()) {
      return;
    }

    switch (event.type) {
      case "IncomingCallReceived":
      case "OutgoingCallStarted":
      case "CallAnswered":
        this.requestMainAcallId(readCallId(event));
        return;
      case "CallEnded":
      case "CallFailed":
        this.sendDlgStop(readCallId(event));
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
  }

  private requestMainAcallId(callId: string | null): void {
    if (callId === null) {
      return;
    }
    this.pendingCorrelationCallId = callId;
    const result = this.deps.ocpGateway.sendCommand({
      kind: "get_main_acallid",
      callId,
    });
    if (!result.ok) {
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
    if (this.pendingCorrelationCallId === callId) {
      this.pendingCorrelationCallId = null;
    }
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
}

function readCallId(event: DomainEvent): string | null {
  const callId = event["callId"];
  return typeof callId === "string" && callId.length > 0 ? callId : null;
}