import { describe, expect, it } from "vitest";
import { deriveHeaderChromeShell } from "./deriveHeaderChromeShell.js";

describe("deriveHeaderChromeShell", () => {
  it("derives registering dot and label", () => {
    const shell = deriveHeaderChromeShell({
      authUiState: "sip_registering",
      registrationState: "registering",
      phoneStatus: "offline",
      agentId: "agent-1",
      sipUsername: null,
    });

    expect(shell.registrationDotVariant).toBe("registering");
    expect(shell.registrationStatusLabel).toBe("Регистрация");
    expect(shell.avatarInitials).toBe("AG");
    expect(shell.showUserIdentity).toBe(false);
  });

  it("derives registered online dot when SIP registered", () => {
    const shell = deriveHeaderChromeShell({
      authUiState: "sip_registered",
      registrationState: "registered",
      phoneStatus: "online",
      agentId: "1001",
      sipUsername: "1001",
    });

    expect(shell.registrationDotVariant).toBe("registered_online");
    expect(shell.registrationStatusLabel).toBe("Зарегистрирован");
    expect(shell.phoneStatusLabel).toBe("В сети");
    expect(shell.registrationDotAriaLabel).toContain("Зарегистрирован");
    expect(shell.showUserIdentity).toBe(true);
    expect(shell.displayName).toBe("1001");
    expect(shell.presenceStatusLabel).toBe("Онлайн");
    expect(shell.presenceStatusTone).toBe("online");
    expect(shell.avatarInitials).toBe("10");
  });

  it("derives DND dot when registered with dnd phone status", () => {
    const shell = deriveHeaderChromeShell({
      authUiState: "sip_registered",
      registrationState: "registered",
      phoneStatus: "dnd",
      agentId: null,
      sipUsername: "operator",
    });

    expect(shell.registrationDotVariant).toBe("registered_dnd");
    expect(shell.avatarInitials).toBe("OP");
    expect(shell.presenceStatusLabel).toBe("Не беспокоить");
  });

  it("derives failed dot on registration failure", () => {
    const shell = deriveHeaderChromeShell({
      authUiState: "sip_registration_failed",
      registrationState: "failed",
      phoneStatus: "offline",
      agentId: "alice.operator",
      sipUsername: "alice.operator",
    });

    expect(shell.registrationDotVariant).toBe("failed");
    expect(shell.registrationStatusLabel).toBe("Ошибка");
    expect(shell.avatarInitials).toBe("AL");
    expect(shell.presenceStatusLabel).toBe("Оффлайн");
  });

  it("derives not_registered when idle", () => {
    const shell = deriveHeaderChromeShell({
      authUiState: "sip_only_ready",
      registrationState: "idle",
      phoneStatus: "offline",
      agentId: "Bob Smith",
      sipUsername: null,
    });

    expect(shell.registrationDotVariant).toBe("not_registered");
    expect(shell.registrationStatusLabel).toBe("Не зарегистрирован");
    expect(shell.avatarInitials).toBe("BS");
    expect(shell.showUserIdentity).toBe(false);
  });

  it("derives failed dot when SIP transport is disconnected", () => {
    const shell = deriveHeaderChromeShell({
      authUiState: "sip_only_ready",
      registrationState: "idle",
      phoneStatus: "offline",
      agentId: "agent-1",
      sipUsername: "agent-1",
      connectionState: "sip_disconnected",
    });

    expect(shell.registrationDotVariant).toBe("failed");
  });

  it("derives registering dot during registration retry countdown", () => {
    const shell = deriveHeaderChromeShell({
      authUiState: "sip_registration_failed",
      registrationState: "failed",
      phoneStatus: "offline",
      agentId: "agent-1",
      sipUsername: "agent-1",
      connectionState: "reconnecting",
      sipRecoveryMode: "registration",
    });

    expect(shell.registrationDotVariant).toBe("registering");
  });
});
