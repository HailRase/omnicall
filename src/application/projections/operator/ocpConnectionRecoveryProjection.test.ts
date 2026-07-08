import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createOcpDisconnectedEvent,
  createOcpReconnectFailedEvent,
  createOcpReconnectScheduledEvent,
  createOcpReconnectSucceededEvent,
} from "@domain/operator/events/ocpRecoveryEvents.js";
import { createServerTerminateReceivedEvent } from "@domain/operator/events/serverTerminateEvents.js";
import { createManualReconnectRequestedEvent } from "@domain/shared/recovery/manualRecoveryEvents.js";
import {
  initialOcpConnectionRecoveryProjection,
  reduceOcpConnectionRecoveryProjection,
} from "./ocpConnectionRecoveryProjection.js";

describe("ocpConnectionRecoveryProjection", () => {
  const correlationId = createCorrelationId();

  it("starts connected with OCP mode false", () => {
    const projection = initialOcpConnectionRecoveryProjection();
    expect(projection.connectionState).toBe("connected");
    expect(projection.isOcpMode).toBe(false);
  });

  it("enables OCP mode after authentication succeeded", () => {
    const projection = reduceOcpConnectionRecoveryProjection(
      initialOcpConnectionRecoveryProjection(),
      {
        type: "OcpAuthenticationSucceeded",
        correlationId,
        occurredAt: new Date().toISOString(),
        agentId: "agent-1",
      },
    );

    expect(projection.isOcpMode).toBe(true);
  });

  it("ignores OCP disconnect events in SIP-only mode", () => {
    let projection = reduceOcpConnectionRecoveryProjection(
      initialOcpConnectionRecoveryProjection(),
      {
        type: "StartupModeResolved",
        correlationId,
        occurredAt: new Date().toISOString(),
        resolution: { action: "sip_only_ready" },
      },
    );

    projection = reduceOcpConnectionRecoveryProjection(
      projection,
      createOcpDisconnectedEvent(correlationId, { reason: "transport_closed" }),
    );

    expect(projection.connectionState).toBe("connected");
    expect(projection.ocpReconnectAttempt).toBeNull();
  });

  it("transitions to reconnecting on OcpReconnectScheduled", () => {
    let projection = reduceOcpConnectionRecoveryProjection(
      initialOcpConnectionRecoveryProjection(),
      {
        type: "OcpAuthenticationSucceeded",
        correlationId,
        occurredAt: "2026-06-24T10:00:00.000Z",
        agentId: "agent-1",
      },
    );

    const scheduledEvent = {
      ...createOcpReconnectScheduledEvent(correlationId, {
        attemptNumber: 2,
        delayMs: 5000,
      }),
      occurredAt: "2026-06-24T10:00:00.000Z",
    };

    projection = reduceOcpConnectionRecoveryProjection(projection, scheduledEvent);

    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.reconnectAttempt).toBe(2);
    expect(projection.ocpReconnectAttempt).toBe(2);
    expect(projection.nextRetryAt).toBe("2026-06-24T10:00:05.000Z");
  });

  it("returns to connected on OcpReconnectSucceeded", () => {
    let projection = reduceOcpConnectionRecoveryProjection(
      initialOcpConnectionRecoveryProjection(),
      {
        type: "OcpAuthenticationSucceeded",
        correlationId,
        occurredAt: new Date().toISOString(),
        agentId: "agent-1",
      },
    );
    projection = reduceOcpConnectionRecoveryProjection(
      projection,
      createOcpReconnectScheduledEvent(correlationId, { attemptNumber: 1, delayMs: 5000 }),
    );
    projection = reduceOcpConnectionRecoveryProjection(
      projection,
      createOcpReconnectSucceededEvent(correlationId, { attemptNumber: 1 }),
    );

    expect(projection.connectionState).toBe("connected");
    expect(projection.ocpReconnectAttempt).toBeNull();
  });

  it("marks terminal OCP failure", () => {
    let projection = reduceOcpConnectionRecoveryProjection(
      initialOcpConnectionRecoveryProjection(),
      {
        type: "OcpAuthenticationSucceeded",
        correlationId,
        occurredAt: new Date().toISOString(),
        agentId: "agent-1",
      },
    );
    projection = reduceOcpConnectionRecoveryProjection(
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

  it("maps server terminate to server_terminate state", () => {
    const projection = reduceOcpConnectionRecoveryProjection(
      initialOcpConnectionRecoveryProjection(),
      createServerTerminateReceivedEvent(correlationId, {
        entityId: "agent-1",
        reason: "server_terminate",
      }),
    );

    expect(projection.connectionState).toBe("server_terminate");
  });

  it("enters reconnecting on manual OCP reconnect request", () => {
    let projection = reduceOcpConnectionRecoveryProjection(
      initialOcpConnectionRecoveryProjection(),
      {
        type: "OcpAuthenticationSucceeded",
        correlationId,
        occurredAt: new Date().toISOString(),
        agentId: "agent-1",
      },
    );

    projection = reduceOcpConnectionRecoveryProjection(
      projection,
      createManualReconnectRequestedEvent(correlationId, { channel: "ocp" }),
    );

    expect(projection.connectionState).toBe("reconnecting");
    expect(projection.ocpReconnectAttempt).toBe(1);
  });
});
