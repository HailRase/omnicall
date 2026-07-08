import { describe, expect, it } from "vitest";
import { mapAvatarMenuLogoutDisabledReason } from "./mapAvatarMenuLogoutDisabledReason.js";

const baseShell = {
  showEndSessionControl: false,
  endSessionDisabledReason: null,
  logoutConfirmationRequired: false,
  logoutInProgress: false,
  showLogoutErrorBanner: false,
  logoutErrorMessage: null,
};

describe("mapAvatarMenuLogoutDisabledReason", () => {
  it("returns null when end session control is available", () => {
    expect(
      mapAvatarMenuLogoutDisabledReason({
        authUiState: "sip_registered",
        shell: { ...baseShell, showEndSessionControl: true },
      }),
    ).toBeNull();
  });

  it("prefers shell disabled reason", () => {
    expect(
      mapAvatarMenuLogoutDisabledReason({
        authUiState: "sip_registered",
        shell: {
          ...baseShell,
          showEndSessionControl: true,
          endSessionDisabledReason: "session.logout.disabled.inProgress",
        },
      }),
    ).toBe("Выход выполняется");
  });

  it("maps registering state to Russian reason", () => {
    expect(
      mapAvatarMenuLogoutDisabledReason({
        authUiState: "sip_registering",
        shell: baseShell,
      }),
    ).toBe("Регистрация выполняется");
  });
});
