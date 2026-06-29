import { describe, expect, it } from "vitest";
import { deriveAuthShellFlags } from "./deriveAuthShellFlags.js";
import { initialAccountBootstrapProjection } from "./accountBootstrapProjection.js";

describe("deriveAuthShellFlags", () => {
  it("shows account panel for sip_only_ready", () => {
    expect(
      deriveAuthShellFlags({
        ...initialAccountBootstrapProjection(),
        authUiState: "sip_only_ready",
      }).showAccountPanel,
    ).toBe(true);
  });

  it("blocks controls while registering", () => {
    expect(
      deriveAuthShellFlags({
        ...initialAccountBootstrapProjection(),
        authUiState: "sip_registering",
      }).blockingAuthState,
    ).toBe(true);
  });

  it("does not block when sip registered", () => {
    expect(
      deriveAuthShellFlags({
        ...initialAccountBootstrapProjection(),
        authUiState: "sip_registered",
      }).blockingAuthState,
    ).toBe(false);
  });

  it("marks sip registered only in sip_registered auth state", () => {
    expect(
      deriveAuthShellFlags({
        ...initialAccountBootstrapProjection(),
        authUiState: "sip_registered",
      }).isSipRegistered,
    ).toBe(true);
    expect(
      deriveAuthShellFlags({
        ...initialAccountBootstrapProjection(),
        authUiState: "sip_registration_failed",
      }).isSipRegistered,
    ).toBe(false);
  });
});
