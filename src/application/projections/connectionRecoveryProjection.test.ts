import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { createSipAccountId } from "@domain/index.js";
import {
  createOcpDisconnectedEvent,
  createOcpReconnectFailedEvent,
  createOcpReconnectScheduledEvent,
  createOcpReconnectSucceededEvent,
} from "@domain/operator/events/ocpRecoveryEvents.js";
import { createServerTerminateReceivedEvent } from "@domain/operator/events/serverTerminateEvents.js";
import {
  createSipReconnectAttemptStartedEvent,
  createSipReconnectFailedEvent,
  createSipReconnectScheduledEvent,
  createSipReconnectSucceededEvent,
} from "@domain/telephony/events/sipRecoveryEvents.js";
import { createManualReconnectRequestedEvent } from "@domain/shared/recovery/manualRecoveryEvents.js";
import {
  initialConnectionRecoveryProjection,
  reduceConnectionRecoveryProjection,
} from "./connectionRecoveryProjection.js";

describe("connectionRecoveryProjection", () => {
  const correlationId = createCorrelationId();

  it("starts connected with OCP mode false", () => {
    const projection = initialConnectionRecoveryProjection();
    expect(projection.connectionState).toBe("connected");
    expect(projection.isOcpMode).toBe(false);
  });

  it("enables OCP mode after authentication succeeded", () => {
    const projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });

    expect(projection.isOcpMode).toBe(true);
  });

  it("ignores OCP disconnect events in SIP-only mode", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "StartupModeResolved",
      correlationId,
      occurredAt: new Date().toISOString(),
      resolution: { action: "sip_only_ready" },
    });

    projection = reduceConnectionRecoveryProjection(
      projection,
      createOcpDisconnectedEvent(correlationId, { reason: "transport_closed" }),
    );

    expect(projection.connectionState).toBe("connected");
    expect(projection.ocpReconnectAttempt).toBeNull();
  });

  it("transitions to reconnecting on OcpReconnectScheduled", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: "2026-06-24T10:00:00.000Z",
      agentId: "agent-1",
    });

    const scheduledEvent = {
      ...createOcpReconnectScheduledEvent(correlationId, {
        attemptNumber: 2,
        delayMs: 5000,
      }),
      occurredAt: "2026-06-24T10:00:00.000Z",
    };

    projection = reduceConnectionRecoveryProjection(projection, scheduledEvent);

    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.reconnectAttempt).toBe(2);
    expect(projection.ocpReconnectAttempt).toBe(2);
    expect(projection.nextRetryAt).toBe("2026-06-24T10:00:05.000Z");
  });

  it("returns to connected on OcpReconnectSucceeded when SIP is healthy", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });
    projection = reduceConnectionRecoveryProjection(
      projection,
      createOcpReconnectScheduledEvent(correlationId, { attemptNumber: 1, delayMs: 5000 }),
    );
    projection = reduceConnectionRecoveryProjection(
      projection,
      createOcpReconnectSucceededEvent(correlationId, { attemptNumber: 1 }),
    );

    expect(projection.connectionState).toBe("connected");
    expect(projection.ocpReconnectAttempt).toBeNull();
  });

  it("marks terminal OCP failure", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });
    projection = reduceConnectionRecoveryProjection(
      projection,
      createOcpReconnectFailedEvent(correlationId, {
        attemptNumber: 6,
        reason: "max_attempts",
        isTerminal: true,
      }),
    );

    expect(projection.connectionState).toBe("manual_retry_available");
    expect(projection.lastFailureReason).toBe("max_attempts");
  });

  it("enters in-progress reconnecting on SipReconnectAttemptStarted", () => {
    let projection = reduceConnectionRecoveryProjection(
      initialConnectionRecoveryProjection(),
      createSipReconnectScheduledEvent(correlationId, {
        attemptNumber: 1,
        delayMs: 5000,
      }),
    );

    projection = reduceConnectionRecoveryProjection(
      projection,
      createSipReconnectAttemptStartedEvent(correlationId, { attemptNumber: 1 }),
    );

    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.sipReconnectAttempt).toBe(1);
    expect(projection.nextRetryAt).toBeNull();
  });

  it("stays reconnecting on non-terminal SIP failure", () => {
    let projection = reduceConnectionRecoveryProjection(
      initialConnectionRecoveryProjection(),
      createSipReconnectScheduledEvent(correlationId, {
        attemptNumber: 1,
        delayMs: 2000,
      }),
    );

    projection = reduceConnectionRecoveryProjection(
      projection,
      createSipReconnectFailedEvent(correlationId, {
        attemptNumber: 1,
        reason: "registration_timeout",
        isTerminal: false,
      }),
    );

    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.sipReconnectAttempt).toBe(1);
  });

  it("handles SIP reconnect schedule and success", () => {
    let projection = reduceConnectionRecoveryProjection(
      initialConnectionRecoveryProjection(),
      createSipReconnectScheduledEvent(correlationId, {
        attemptNumber: 1,
        delayMs: 2000,
      }),
    );
    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.sipReconnectAttempt).toBe(1);

    projection = reduceConnectionRecoveryProjection(
      projection,
      createSipReconnectSucceededEvent(correlationId, { attemptNumber: 1 }),
    );
    expect(projection.connectionState).toBe("connected");
  });

  it("marks terminal SIP failure", () => {
    const projection = reduceConnectionRecoveryProjection(
      initialConnectionRecoveryProjection(),
      createSipReconnectFailedEvent(correlationId, {
        attemptNumber: 10,
        reason: "registration_timeout",
        isTerminal: true,
      }),
    );

    expect(projection.connectionState).toBe("manual_retry_available");
    expect(projection.sipReconnectAttempt).toBe(10);
  });

  it("enters reconnecting on ManualReconnectRequested", () => {
    let projection = reduceConnectionRecoveryProjection(
      initialConnectionRecoveryProjection(),
      createSipReconnectFailedEvent(correlationId, {
        attemptNumber: 10,
        reason: "registration_timeout",
        isTerminal: true,
      }),
    );

    projection = reduceConnectionRecoveryProjection(
      projection,
      createManualReconnectRequestedEvent(correlationId, { channel: "sip" }),
    );

    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.sipReconnectAttempt).toBe(1);
  });

  it("sets sip_disconnected on RegistrationFailed", () => {
    const projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "RegistrationFailed",
      correlationId,
      occurredAt: new Date().toISOString(),
      accountId: createSipAccountId("acc-1"),
      reason: "transport_error",
    });

    expect(projection.connectionState).toBe("sip_disconnected");
    expect(projection.lastFailureReason).toBe("transport_error");
  });

  it("enters server_terminate state", () => {
    const projection = reduceConnectionRecoveryProjection(
      initialConnectionRecoveryProjection(),
      createServerTerminateReceivedEvent(correlationId, {
        entityId: "agent-1",
        reason: "admin_terminate",
      }),
    );

    expect(projection.connectionState).toBe("server_terminate");
    expect(projection.lastFailureReason).toBe("admin_terminate");
  });
});
