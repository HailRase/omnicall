import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createAgentStatusChangeRejectedEvent,
  createAgentStatusChangeRequestedEvent,
  createAgentStatusChangedEvent,
} from "@domain/operator/events/agentStatusEvents.js";
import { createBreakReasonsReceivedEvent } from "@domain/operator/events/breakReasonsEvents.js";
import { createPostCallStatusUpdatedEvent } from "@domain/operator/events/postCallStatusEvents.js";
import { createStartupModeResolvedEvent, createBreakReason, createCallId } from "@domain/index.js";
import { createStatusReason } from "@domain/operator/StatusReason.js";
import {
  initialOperatorStatusProjection,
  reduceOperatorStatusProjection,
} from "./operatorStatusProjection.js";

describe("operatorStatusProjection", () => {
  const correlationId = createCorrelationId();

  it("keeps OCP status unavailable in SIP-only mode", () => {
    const projection = reduceOperatorStatusProjection(
      initialOperatorStatusProjection(),
      createStartupModeResolvedEvent(correlationId, {
        mode: "sip-only",
        resolution: { action: "sip_only_ready" },
      }),
    );

    expect(projection.isOcpStatusAvailable).toBe(false);
    expect(projection.currentStatus).toBeNull();
  });

  it("marks OCP status available after authentication succeeded", () => {
    let projection = initialOperatorStatusProjection();
    projection = reduceOperatorStatusProjection(projection, {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      sessionId: "session-1",
      agentId: "agent-001",
    });

    expect(projection.isOcpStatusAvailable).toBe(true);
  });

  it("tracks pending status on change requested", () => {
    const projection = reduceOperatorStatusProjection(
      initialOperatorStatusProjection(),
      createAgentStatusChangeRequestedEvent(correlationId, {
        previousStatus: "ready",
        targetStatus: "break",
        reason: createStatusReason("meeting"),
      }),
    );

    expect(projection.pendingStatus).toBe("break");
    expect(projection.statusChangeInProgress).toBe(true);
    expect(projection.lastRejectionReason).toBeNull();
  });

  it("commits current status on AgentStatusChanged", () => {
    const changedAt = new Date().toISOString();
    const projection = reduceOperatorStatusProjection(
      {
        ...initialOperatorStatusProjection(),
        isOcpStatusAvailable: true,
        pendingStatus: "break",
        statusChangeInProgress: true,
      },
      createAgentStatusChangedEvent(correlationId, {
        previousStatus: "ready",
        currentStatus: "break",
        reason: createStatusReason("meeting"),
        changedAt,
      }),
    );

    expect(projection.currentStatus).toBe("break");
    expect(projection.pendingStatus).toBeNull();
    expect(projection.statusChangeInProgress).toBe(false);
    expect(projection.currentBreakReason).toBe("meeting");
    expect(projection.statusChangedAt).toBe(changedAt);
  });

  it("stores rejection reason on AgentStatusChangeRejected", () => {
    const projection = reduceOperatorStatusProjection(
      {
        ...initialOperatorStatusProjection(),
        pendingStatus: "ready",
        statusChangeInProgress: true,
      },
      createAgentStatusChangeRejectedEvent(correlationId, {
        previousStatus: "break",
        targetStatus: "ready",
        reason: "dnd_blocks_ready",
      }),
    );

    expect(projection.pendingStatus).toBeNull();
    expect(projection.statusChangeInProgress).toBe(false);
    expect(projection.lastRejectionReason).toBe("dnd_blocks_ready");
  });

  it("clears currentBreakReason when leaving break status", () => {
    const changedAt = new Date().toISOString();
    const projection = reduceOperatorStatusProjection(
      {
        ...initialOperatorStatusProjection(),
        isOcpStatusAvailable: true,
        currentStatus: "break",
        currentBreakReason: createStatusReason("meeting"),
      },
      createAgentStatusChangedEvent(correlationId, {
        previousStatus: "break",
        currentStatus: "ready",
        reason: null,
        changedAt,
      }),
    );

    expect(projection.currentStatus).toBe("ready");
    expect(projection.currentBreakReason).toBeNull();
  });

  it("stores gateway rejection reasons", () => {
    const projection = reduceOperatorStatusProjection(
      initialOperatorStatusProjection(),
      createAgentStatusChangeRejectedEvent(correlationId, {
        previousStatus: "ready",
        targetStatus: "break",
        reason: "gateway_failed",
      }),
    );

    expect(projection.lastRejectionReason).toBe("gateway_failed");
  });

  it("tracks allowed break reasons count from BreakReasonsReceived", () => {
    const projection = reduceOperatorStatusProjection(
      initialOperatorStatusProjection(),
      createBreakReasonsReceivedEvent(correlationId, {
        reasons: [createBreakReason("meeting"), createBreakReason("break")],
      }),
    );

    expect(projection.allowedBreakReasonsCount).toBe(2);
  });

  it("tracks post-call state from PostCallStatusUpdated", () => {
    const updatedAt = new Date().toISOString();
    const projection = reduceOperatorStatusProjection(
      initialOperatorStatusProjection(),
      createPostCallStatusUpdatedEvent(correlationId, {
        callId: createCallId("call-9"),
        postCallStatus: "post_call",
        reason: createBreakReason("meeting"),
        updatedAt,
      }),
    );

    expect(projection.currentStatus).toBe("post_call");
    expect(projection.postCallCallId).toBe("call-9");
    expect(projection.lastPostCallUpdatedAt).toBe(updatedAt);
  });

  it("sets timerRunning after AgentStatusChanged", () => {
    const changedAt = new Date().toISOString();
    const projection = reduceOperatorStatusProjection(
      initialOperatorStatusProjection(),
      createAgentStatusChangedEvent(correlationId, {
        previousStatus: null,
        currentStatus: "ready",
        reason: null,
        changedAt,
      }),
    );

    expect(projection.timerRunning).toBe(true);
  });
});
