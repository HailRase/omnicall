import { describe, expect, it } from "vitest";
import { deriveSessionLogoutShell } from "./deriveSessionLogoutShell.js";
import { initialIncomingCallProjection } from "../telephony/incomingCallProjection.js";
import { initialMultiCallProjection } from "../telephony/multiCallProjection.js";
import { initialMultiLineCallProjection } from "../telephony/multiLineCallProjection.js";
import { initialTransferProjection } from "../telephony/transferProjection.js";

describe("deriveSessionLogoutShell", () => {
  const baseInput = {
    authUiState: "sip_registered" as const,
    hasActiveAccountSession: true,
    multiCallProjection: initialMultiCallProjection(),
    incomingCallProjection: initialIncomingCallProjection(),
    transferProjection: initialTransferProjection(),
    multiLineCallProjection: initialMultiLineCallProjection(),
    logoutInProgress: false,
    logoutError: null,
  };

  it("shows end session control in sip-only registered state", () => {
    const shell = deriveSessionLogoutShell(baseInput);

    expect(shell.showEndSessionControl).toBe(true);
    expect(shell.endSessionDisabledReason).toBeNull();
    expect(shell.logoutConfirmationRequired).toBe(false);
  });

  it("shows end session control when account session is active after SIP failure", () => {
    const shell = deriveSessionLogoutShell({
      ...baseInput,
      authUiState: "sip_registration_failed",
    });

    expect(shell.showEndSessionControl).toBe(true);
  });

  it("hides end session control without an active account session", () => {
    const shell = deriveSessionLogoutShell({
      ...baseInput,
      authUiState: "sip_only_ready",
      hasActiveAccountSession: false,
    });

    expect(shell.showEndSessionControl).toBe(false);
  });

  it("requires confirmation when established call exists", () => {
    const shell = deriveSessionLogoutShell({
      ...baseInput,
      multiCallProjection: {
        ...initialMultiCallProjection(),
        hasEstablishedCall: true,
        establishedCallCount: 1,
      },
    });

    expect(shell.logoutConfirmationRequired).toBe(true);
  });

  it("requires confirmation for incoming ringing", () => {
    const shell = deriveSessionLogoutShell({
      ...baseInput,
      incomingCallProjection: {
        ...initialIncomingCallProjection(),
        ringingIndicator: "ringing",
        uiState: "incomingRinging",
        visible: true,
      },
    });

    expect(shell.logoutConfirmationRequired).toBe(true);
  });

  it("disables control while logout in progress", () => {
    const shell = deriveSessionLogoutShell({
      ...baseInput,
      logoutInProgress: true,
    });

    expect(shell.endSessionDisabledReason).toBe("session.logout.disabled.inProgress");
  });
});
