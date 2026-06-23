import { describe, expect, it } from "vitest";
import {
  initialConnectionRecoveryProjection,
  reduceConnectionRecoveryProjection,
} from "./connectionRecoveryProjection.js";
import { deriveConnectionRecoveryShell } from "./deriveConnectionRecoveryShell.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createOcpDisconnectedEvent,
  createOcpReconnectScheduledEvent,
} from "@domain/operator/events/ocpRecoveryEvents.js";
import {
  createSipReconnectFailedEvent,
  createSipReconnectScheduledEvent,
} from "@domain/telephony/events/sipRecoveryEvents.js";

describe("deriveConnectionRecoveryShell", () => {
  const correlationId = createCorrelationId();

  it("hides overlay when connected", () => {
    const shell = deriveConnectionRecoveryShell(initialConnectionRecoveryProjection());
    expect(shell.showOverlay).toBe(false);
    expect(shell.isBlocking).toBe(false);
  });

  it("shows non-blocking OCP-only disconnect banner", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });
    projection = reduceConnectionRecoveryProjection(
      projection,
      createOcpDisconnectedEvent(correlationId, {
        reason: "transport_closed",
        message: "closed",
      }),
    );

    const shell = deriveConnectionRecoveryShell(projection);
    expect(shell.showOverlay).toBe(true);
    expect(shell.isBlocking).toBe(false);
    expect(shell.showOcpRow).toBe(true);
    expect(shell.showSipRow).toBe(false);
  });

  it("blocks overlay when SIP reconnecting", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "RegistrationFailed",
      correlationId,
      occurredAt: new Date().toISOString(),
      accountId: "acc-1",
      reason: "transport_closed",
    });
    projection = reduceConnectionRecoveryProjection(
      projection,
      createSipReconnectScheduledEvent(correlationId, { attemptNumber: 1, delayMs: 5000 }),
    );

    const shell = deriveConnectionRecoveryShell(projection);
    expect(shell.isBlocking).toBe(true);
    expect(shell.showSipRow).toBe(true);
  });

  it("shows OCP row only during OCP reconnect in OCP mode", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "OcpAuthenticationSucceeded",
      correlationId,
      occurredAt: new Date().toISOString(),
      agentId: "agent-1",
    });
    projection = reduceConnectionRecoveryProjection(
      projection,
      createOcpReconnectScheduledEvent(correlationId, { attemptNumber: 2, delayMs: 5000 }),
    );

    const shell = deriveConnectionRecoveryShell(projection);
    expect(shell.showOcpRow).toBe(true);
    expect(shell.showSipRow).toBe(false);
    expect(shell.retryDisabledReason).toBe("Automatic reconnect in progress");
  });

  it("enables retry when manual_retry_available", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "RegistrationFailed",
      correlationId,
      occurredAt: new Date().toISOString(),
      accountId: "acc-1",
      reason: "transport_closed",
    });
    projection = reduceConnectionRecoveryProjection(
      projection,
      createSipReconnectFailedEvent(correlationId, {
        attemptNumber: 10,
        reason: "registration_timeout",
        isTerminal: true,
      }),
    );

    const shell = deriveConnectionRecoveryShell(projection);
    expect(shell.retryDisabledReason).toBeNull();
    expect(shell.showReregisterSipControl).toBe(true);
    expect(shell.reregisterDisabledReason).toBeNull();
  });
});
