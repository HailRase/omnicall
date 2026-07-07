import { describe, expect, it } from "vitest";
import { mapAvatarMenuShellNavigationDisabledReason } from "./mapAvatarMenuShellNavigationDisabledReason.js";

describe("mapAvatarMenuShellNavigationDisabledReason", () => {
  it("returns null when SIP is registered", () => {
    expect(
      mapAvatarMenuShellNavigationDisabledReason({
        isSipRegistered: true,
        authUiState: "sip_registered",
      }),
    ).toBeNull();
  });

  it("returns login required reason for sip-only ready state", () => {
    expect(
      mapAvatarMenuShellNavigationDisabledReason({
        isSipRegistered: false,
        authUiState: "sip_only_ready",
      }),
    ).toBe("Сначала войдите в аккаунт");
  });

  it("returns not registered reason for other unregistered states", () => {
    expect(
      mapAvatarMenuShellNavigationDisabledReason({
        isSipRegistered: false,
        authUiState: "sip_registering",
      }),
    ).toBe("Не зарегистрирован");
  });
});
