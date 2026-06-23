import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createCallId } from "@domain/telephony/CallId.js";
import { createMainAcallId } from "@domain/operator/ocp/MainAcallId.js";
import { createQueueInfoReceivedEvent } from "@domain/operator/events/queueInfoEvents.js";
import {
  deriveQueueLabelState,
  getQueueNameForCall,
  initialQueueInfoProjection,
  reduceQueueInfoProjection,
} from "./queueInfoProjection.js";

describe("queueInfoProjection", () => {
  const correlationId = createCorrelationId();
  const callId = createCallId("call-1");

  it("enables OCP sync after authentication succeeded", () => {
    const projection = reduceQueueInfoProjection(initialQueueInfoProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });

    expect(projection.isOcpSyncAvailable).toBe(true);
  });

  it("stores queue name on QueueInfoReceived", () => {
    const authenticated = reduceQueueInfoProjection(initialQueueInfoProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });

    const withQueue = reduceQueueInfoProjection(
      authenticated,
      createQueueInfoReceivedEvent(correlationId, {
        callId,
        mainAcallId: createMainAcallId("acall-1"),
        queueName: "Sales",
      }),
    );

    expect(getQueueNameForCall(withQueue, callId)).toBe("Sales");
    expect(deriveQueueLabelState(withQueue, callId)).toBe("ready");
  });

  it("clears queue name on CallEnded", () => {
    let projection = reduceQueueInfoProjection(initialQueueInfoProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });
    projection = reduceQueueInfoProjection(
      projection,
      createQueueInfoReceivedEvent(correlationId, {
        callId,
        mainAcallId: createMainAcallId("acall-1"),
        queueName: "Sales",
      }),
    );

    const cleared = reduceQueueInfoProjection(projection, {
      type: "CallEnded",
      correlationId,
      occurredAt: new Date().toISOString(),
      callId,
    });

    expect(getQueueNameForCall(cleared, callId)).toBeNull();
    expect(deriveQueueLabelState(cleared, callId)).toBe("loading");
  });

  it("resets on SIP-only startup resolution", () => {
    let projection = reduceQueueInfoProjection(initialQueueInfoProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });
    projection = reduceQueueInfoProjection(
      projection,
      createQueueInfoReceivedEvent(correlationId, {
        callId,
        mainAcallId: createMainAcallId("acall-1"),
        queueName: "Sales",
      }),
    );

    const sipOnly = reduceQueueInfoProjection(projection, {
      type: "StartupModeResolved",
      correlationId,
      occurredAt: new Date().toISOString(),
      resolution: { action: "sip_only_ready" },
    });

    expect(sipOnly.isOcpSyncAvailable).toBe(false);
    expect(sipOnly.queueNameByCallId.size).toBe(0);
    expect(deriveQueueLabelState(sipOnly, callId)).toBe("hidden");
  });
});
