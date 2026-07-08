import { describe, expect, it } from "vitest";
import {
  createIdleSipSessionHealth,
  type SipSessionHealth,
} from "@domain/index.js";
import { deriveHeaderChromeShell } from "./deriveHeaderChromeShell.js";

const NOW_MS = Date.parse("2026-06-24T10:00:00.000Z");

function health(partial: Partial<SipSessionHealth>): SipSessionHealth {
  return {
    ...createIdleSipSessionHealth(),
    lifecycle: "active",
    ...partial,
  };
}

describe("deriveHeaderChromeShell", () => {
  it("derives idle status when session is not active", () => {
    const shell = deriveHeaderChromeShell({
      health: createIdleSipSessionHealth(),
      agentId: "agent-1",
      sipUsername: null,
      nowMs: NOW_MS,
    });

    expect(shell.registrationDotVariant).toBe("not_registered");
    expect(shell.registrationDotAriaLabelParams.statusKey).toBe("header.sipStatus.notConnected");
    expect(shell.avatarInitials).toBe("AG");
    expect(shell.showUserIdentity).toBe(false);
  });

  it("derives registered status when transport and registration are healthy", () => {
    const shell = deriveHeaderChromeShell({
      health: health({ transport: "connected", registration: "registered" }),
      agentId: "1001",
      sipUsername: "1001",
      nowMs: NOW_MS,
    });

    expect(shell.registrationDotVariant).toBe("registered_online");
    expect(shell.sipStatusLabelKey).toBe("header.sipStatus.registered");
    expect(shell.sipStatusTimerSuffix).toBeNull();
    expect(shell.sipStatusTone).toBe("registered");
    expect(shell.showUserIdentity).toBe(true);
    expect(shell.displayName).toBe("1001");
    expect(shell.avatarInitials).toBe("10");
  });

  it("derives DND dot when dnd flag is enabled", () => {
    const shell = deriveHeaderChromeShell({
      health: health({ transport: "connected", registration: "registered" }),
      agentId: null,
      sipUsername: "operator",
      dndEnabled: true,
      nowMs: NOW_MS,
    });

    expect(shell.registrationDotVariant).toBe("registered_dnd");
    expect(shell.sipStatusLabelKey).toBe("header.sipStatus.dnd");
    expect(shell.sipStatusTone).toBe("dnd");
  });

  it("derives failed dot and not-registered label on registration failure", () => {
    const shell = deriveHeaderChromeShell({
      health: health({
        transport: "connected",
        registration: "failed",
        recovery: {
          target: "registration",
          attemptNumber: 1,
          maxAttempts: 5,
          nextRetryAt: null,
          lastFailureReason: "403 Forbidden",
        },
      }),
      agentId: "alice.operator",
      sipUsername: "alice.operator",
      nowMs: NOW_MS,
    });

    expect(shell.registrationDotVariant).toBe("not_registered");
    expect(shell.sipStatusLabelKey).toBe("header.sipStatus.notRegistered");
    expect(shell.avatarInitials).toBe("AL");
  });

  it("derives reconnecting dot and timer suffix during transport retry", () => {
    const shell = deriveHeaderChromeShell({
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
      agentId: "agent-1",
      sipUsername: "agent-1",
      sipAutoReconnectEnabled: true,
      nowMs: NOW_MS,
    });

    expect(shell.registrationDotVariant).toBe("failed");
    expect(shell.sipStatusLabelKey).toBe("header.sipStatus.noConnection");
    expect(shell.sipStatusTimerSuffix).toBe("00:45");
    expect(shell.sipStatusTone).toBe("reconnecting");
  });

  it("derives registering dot during initial connection", () => {
    const shell = deriveHeaderChromeShell({
      health: health({ transport: "connecting", registration: "idle" }),
      agentId: "agent-1",
      sipUsername: "agent-1",
      nowMs: NOW_MS,
    });

    expect(shell.registrationDotVariant).toBe("registering");
    expect(shell.sipStatusLabelKey).toBe("header.sipStatus.connecting");
    expect(shell.sipStatusTone).toBe("connecting");
  });
});
