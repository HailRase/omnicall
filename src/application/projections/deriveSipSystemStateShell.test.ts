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

    expect(shell.transportStateLabel).toBe("Подключён");
    expect(shell.registrationStateLabel).toBe("Зарегистрирован");
    expect(shell.summaryLabel).toBe("Зарегистрирован");
    expect(shell.manualTransportReconnectDisabledReason).toBe("Сервер уже подключён");
    expect(shell.manualReregisterDisabledReason).toBeNull();
  });

  it("allows manual transport reconnect when server is disconnected", () => {
    const shell = deriveSipSystemStateShell({
      health: health({ transport: "disconnected", registration: "idle" }),
      sipAutoReconnectEnabled: true,
      sipAutoReregisterEnabled: true,
    });

    expect(shell.manualTransportReconnectDisabledReason).toBeNull();
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
    expect(shell.manualTransportReconnectDisabledReason).toBe("Переподключение выполняется");
    expect(shell.manualReregisterDisabledReason).toBe("Сервер не подключён");
  });

  it("disables manual reregister when transport is down", () => {
    const shell = deriveSipSystemStateShell({
      health: health({ transport: "disconnected", registration: "idle" }),
      sipAutoReconnectEnabled: true,
      sipAutoReregisterEnabled: true,
    });

    expect(shell.manualReregisterDisabledReason).toBe("Сервер не подключён");
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
    expect(shell.manualTransportReconnectDisabledReason).toBe("Сессия не активна");
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
