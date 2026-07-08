import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  createIdleSipSessionHealth,
  type SipSessionHealth,
} from "@domain/index.js";
import { deriveSipSystemStateShell } from "./deriveSipSystemStateShell.js";

function health(partial: Partial<SipSessionHealth>): SipSessionHealth {
  return {
    ...createIdleSipSessionHealth(),
    lifecycle: "active",
    ...partial,
  };
}

describe("deriveSipSystemStateShell", () => {
  it("mirrors header summary for connected registered session", () => {
    const shell = deriveSipSystemStateShell({
      health: health({ transport: "connected", registration: "registered" }),
      sipAutoReconnectEnabled: true,
      sipAutoReregisterEnabled: true,
    });

    expect(shell.transportStateLabelKey).toBe("settings.systemState.transport.connected");
    expect(shell.registrationStateLabelKey).toBe("settings.systemState.registration.registered");
    expect(shell.summaryLabelKey).toBe("header.sipStatus.registered");
    expect(shell.manualTransportReconnectDisabledReasonKey).toBe(
      "settings.systemState.manualTransport.disabled.alreadyConnected",
    );
    expect(shell.manualReregisterDisabledReasonKey).toBeNull();
  });

  it("allows manual transport reconnect when server is disconnected", () => {
    const shell = deriveSipSystemStateShell({
      health: health({ transport: "disconnected", registration: "idle" }),
      sipAutoReconnectEnabled: true,
      sipAutoReregisterEnabled: true,
    });

    expect(shell.manualTransportReconnectDisabledReasonKey).toBeNull();
  });

  it("exposes transport failure reason during reconnect", () => {
    const shell = deriveSipSystemStateShell({
      health: health({
        transport: "reconnecting",
        registration: "idle",
        recovery: {
          target: "transport",
          attemptNumber: 2,
          maxAttempts: 5,
          nextRetryAt: null,
          lastFailureReason: "transport_closed",
        },
      }),
      sipAutoReconnectEnabled: true,
      sipAutoReregisterEnabled: true,
    });

    expect(shell.transportFailureReason).toBe("transport_closed");
    expect(shell.manualTransportReconnectDisabledReasonKey).toBe(
      "settings.systemState.manualTransport.disabled.reconnectInProgress",
    );
    expect(shell.manualReregisterDisabledReasonKey).toBe(
      "settings.systemState.manualReregister.disabled.serverNotConnected",
    );
  });

  it("disables manual reregister when transport is down", () => {
    const shell = deriveSipSystemStateShell({
      health: health({ transport: "disconnected", registration: "idle" }),
      sipAutoReconnectEnabled: true,
      sipAutoReregisterEnabled: true,
    });

    expect(shell.manualReregisterDisabledReasonKey).toBe(
      "settings.systemState.manualReregister.disabled.serverNotConnected",
    );
  });

  it("passes journal entries through", () => {
    const correlationId = createCorrelationId();
    const entry = {
      timestamp: "2026-06-24T10:00:00.000Z",
      correlationId,
      category: "transport" as const,
      eventType: "SipTransportDisconnected",
      detail: "transport_closed",
    };

    const shell = deriveSipSystemStateShell({
      health: createIdleSipSessionHealth(),
      sipAutoReconnectEnabled: true,
      sipAutoReregisterEnabled: true,
      journalEntries: [entry],
    });

    expect(shell.journalEntries).toEqual([entry]);
    expect(shell.manualTransportReconnectDisabledReasonKey).toBe(
      "settings.systemState.manualTransport.disabled.sessionInactive",
    );
  });

  it("does not reference OCP fields (SIP-only path)", () => {
    const shell = deriveSipSystemStateShell({
      health: health({ transport: "connected", registration: "registered" }),
      sipAutoReconnectEnabled: true,
      sipAutoReregisterEnabled: true,
    });

    expect(shell).not.toHaveProperty("showOcpRow");
    expect(shell).not.toHaveProperty("isOcpMode");
  });
});
