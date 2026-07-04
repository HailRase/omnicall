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
  createSipRegistrationRetryFailedEvent,
  createSipRegistrationRetryScheduledEvent,
} from "@domain/telephony/events/sipRegistrationRetryEvents.js";

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

  it("routes SIP registration recovery to avatar ring instead of blocking overlay", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "RegistrationFailed",
      correlationId,
      occurredAt: new Date().toISOString(),
      accountId: "acc-1",
      reason: "transport_closed",
    });
    projection = reduceConnectionRecoveryProjection(
      projection,
      createSipRegistrationRetryScheduledEvent(correlationId, {
        attemptNumber: 1,
        delayMs: 5000,
      }),
    );

    const shell = deriveConnectionRecoveryShell(projection);
    expect(shell.isBlocking).toBe(false);
    expect(shell.showOverlay).toBe(false);
    expect(shell.showAvatarRecoveryRing).toBe(true);
    expect(shell.avatarRecoveryRingTone).toBe("failed");
    expect(shell.avatarRecoveryOverlayMode).toBe("countdown");
    expect(shell.showSipRow).toBe(true);
    expect(projection.sipRecoveryMode).toBe("registration");
  });

  it("routes sip_registration_failed to avatar ring without connection overlay", () => {
    const projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "RegistrationFailed",
      correlationId,
      occurredAt: new Date().toISOString(),
      accountId: "acc-1",
      reason: "authentication_error",
    });

    const shell = deriveConnectionRecoveryShell(projection);
    expect(projection.connectionState).toBe("sip_registration_failed");
    expect(shell.showOverlay).toBe(false);
    expect(shell.isBlocking).toBe(false);
    expect(shell.showAvatarRecoveryRing).toBe(true);
    expect(shell.avatarRecoveryRingTone).toBe("failed");
    expect(shell.avatarRecoveryOverlayMode).toBe("in_progress");
  });

  it("keeps blocking overlay for sip transport disconnect", () => {
    let projection = reduceConnectionRecoveryProjection(initialConnectionRecoveryProjection(), {
      type: "SipReconnectFailed",
      correlationId,
      occurredAt: new Date().toISOString(),
      attemptNumber: 1,
      reason: "transport_closed",
      isTerminal: false,
    });

    projection = {
      ...projection,
      connectionState: "sip_disconnected",
      lastFailureReason: "transport_closed",
    };

    const shell = deriveConnectionRecoveryShell(projection);
    expect(shell.showOverlay).toBe(true);
    expect(shell.isBlocking).toBe(true);
    expect(shell.showAvatarRecoveryRing).toBe(false);
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
    expect(shell.retryDisabledReason).toBe(
      "connection.recovery.disabled.autoReconnectInProgress",
    );
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
      createSipRegistrationRetryFailedEvent(correlationId, {
        attemptNumber: 5,
        reason: "registration_timeout",
        isTerminal: true,
      }),
    );

    const shell = deriveConnectionRecoveryShell(projection);
    expect(shell.retryDisabledReason).toBeNull();
    expect(shell.showReregisterSipControl).toBe(true);
    expect(shell.reregisterDisabledReason).toBeNull();
    expect(shell.showOverlay).toBe(false);
    expect(shell.showAvatarRecoveryRing).toBe(true);
    expect(shell.avatarRecoveryOverlayMode).toBe("reload");
  });
});
