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
        isOcpMode: false,
        authUiState: "sip_registered",
        shell: { ...baseShell, showEndSessionControl: true },
      }),
    ).toBeNull();
  });

  it("prefers shell disabled reason", () => {
    expect(
      mapAvatarMenuLogoutDisabledReason({
        isOcpMode: false,
        authUiState: "sip_registered",
        shell: {
          ...baseShell,
          showEndSessionControl: true,
          endSessionDisabledReason: "Выход выполняется",
        },
      }),
    ).toBe("Выход выполняется");
  });

  it("maps registering state to Russian reason", () => {
    expect(
      mapAvatarMenuLogoutDisabledReason({
        isOcpMode: false,
        authUiState: "sip_registering",
        shell: baseShell,
      }),
    ).toBe("Регистрация выполняется");
  });

  it("maps OCP mode to Russian reason", () => {
    expect(
      mapAvatarMenuLogoutDisabledReason({
        isOcpMode: true,
        authUiState: "sip_registered",
        shell: baseShell,
      }),
    ).toBe("Завершение SIP-сессии недоступно");
  });
});
