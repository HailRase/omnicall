import { describe, expect, it } from "vitest";
import {
  createIdleSipSessionHealth,
  EMPTY_SIP_RECOVERY_SNAPSHOT,
  type SipSessionHealth,
} from "@domain/index.js";
import { deriveSipStatusShell } from "./deriveSipStatusShell.js";

const NOW_MS = Date.parse("2026-06-24T10:00:00.000Z");

function health(partial: Partial<SipSessionHealth>): SipSessionHealth {
  return {
    ...createIdleSipSessionHealth(),
    lifecycle: "active",
    ...partial,
  };
}

describe("deriveSipStatusShell", () => {
  it("§1.2 idle — Не подключено", () => {
    const shell = deriveSipStatusShell({
      health: createIdleSipSessionHealth(),
      nowMs: NOW_MS,
    });
    expect(shell.dotTone).toBe("idle");
    expect(shell.primaryLabel).toBe("Не подключено");
    expect(shell.timerSuffix).toBeNull();
  });

  it("§1.2 transport connecting — Соединение", () => {
    const shell = deriveSipStatusShell({
      health: health({ transport: "connecting", registration: "idle" }),
      nowMs: NOW_MS,
    });
    expect(shell.dotTone).toBe("connecting");
    expect(shell.primaryLabel).toBe("Соединение");
  });

  it("§1.2 transport reconnecting — Нет соединения + timer", () => {
    const shell = deriveSipStatusShell({
      health: health({
        transport: "reconnecting",
        registration: "idle",
        recovery: {
          target: "transport",
          attemptNumber: 2,
          maxAttempts: 5,
          nextRetryAt: "2026-06-24T10:00:45.000Z",
          lastFailureReason: null,
        },
      }),
      sipAutoReconnectEnabled: true,
      nowMs: NOW_MS,
    });
    expect(shell.dotTone).toBe("reconnecting");
    expect(shell.primaryLabel).toBe("Нет соединения");
    expect(shell.timerSuffix).toBe("00:45");
  });

  it("§1.2 transport disconnected terminal — Нет соединения", () => {
    const shell = deriveSipStatusShell({
      health: health({ transport: "disconnected", registration: "idle" }),
      nowMs: NOW_MS,
    });
    expect(shell.dotTone).toBe("disconnected");
    expect(shell.primaryLabel).toBe("Нет соединения");
    expect(shell.timerSuffix).toBeNull();
  });

  it("§1.2 transport connected, REGISTER in flight — Соединение", () => {
    const shell = deriveSipStatusShell({
      health: health({ transport: "connected", registration: "registering" }),
      nowMs: NOW_MS,
    });
    expect(shell.dotTone).toBe("registering");
    expect(shell.primaryLabel).toBe("Соединение");
  });

  it("§1.2 transport connected, REGISTER retry — Не зарегистрирован + timer", () => {
    const shell = deriveSipStatusShell({
      health: health({
        transport: "connected",
        registration: "failed",
        recovery: {
          target: "registration",
          attemptNumber: 1,
          maxAttempts: 5,
          nextRetryAt: "2026-06-24T10:00:12.000Z",
          lastFailureReason: "server_error",
        },
      }),
      sipAutoReregisterEnabled: true,
      nowMs: NOW_MS,
    });
    expect(shell.dotTone).toBe("not_registered");
    expect(shell.primaryLabel).toBe("Не зарегистрирован");
    expect(shell.timerSuffix).toBe("00:12");
  });

  it("§1.2 transport connected, not registered manual — Не зарегистрирован", () => {
    const shell = deriveSipStatusShell({
      health: health({
        transport: "connected",
        registration: "idle",
        recovery: EMPTY_SIP_RECOVERY_SNAPSHOT,
      }),
      sipAutoReregisterEnabled: false,
      nowMs: NOW_MS,
    });
    expect(shell.dotTone).toBe("not_registered");
    expect(shell.primaryLabel).toBe("Не зарегистрирован");
    expect(shell.timerSuffix).toBeNull();
  });

  it("§1.2 registered — Зарегистрирован", () => {
    const shell = deriveSipStatusShell({
      health: health({ transport: "connected", registration: "registered" }),
      nowMs: NOW_MS,
    });
    expect(shell.dotTone).toBe("registered");
    expect(shell.primaryLabel).toBe("Зарегистрирован");
  });

  it("§1.2 registered + DND — Не беспокоить", () => {
    const shell = deriveSipStatusShell({
      health: health({ transport: "connected", registration: "registered" }),
      dndEnabled: true,
      nowMs: NOW_MS,
    });
    expect(shell.dotTone).toBe("dnd");
    expect(shell.primaryLabel).toBe("Не беспокоить");
  });

  it("never shows registered when transport is down", () => {
    const shell = deriveSipStatusShell({
      health: health({ transport: "disconnected", registration: "registered" }),
      nowMs: NOW_MS,
    });
    expect(shell.primaryLabel).toBe("Нет соединения");
    expect(shell.dotTone).toBe("disconnected");
  });

  it("hides reconnect timer when auto reconnect is disabled", () => {
    const shell = deriveSipStatusShell({
      health: health({
        transport: "reconnecting",
        registration: "idle",
        recovery: {
          target: "transport",
          attemptNumber: 1,
          maxAttempts: 5,
          nextRetryAt: "2026-06-24T10:00:30.000Z",
          lastFailureReason: null,
        },
      }),
      sipAutoReconnectEnabled: false,
      nowMs: NOW_MS,
    });
    expect(shell.timerSuffix).toBeNull();
  });
});
