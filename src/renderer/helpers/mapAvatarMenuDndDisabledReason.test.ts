import { describe, expect, it } from "vitest";
import { mapAvatarMenuDndDisabledReason } from "./mapAvatarMenuDndDisabledReason.js";

describe("mapAvatarMenuDndDisabledReason", () => {
  it("returns null when phone status is available and SIP is registered", () => {
    expect(
      mapAvatarMenuDndDisabledReason({
        phoneStatusDisabled: false,
        isSipRegistered: true,
      }),
    ).toBeNull();
  });

  it("returns phone status reason when phone status shell is locked", () => {
    expect(
      mapAvatarMenuDndDisabledReason({
        phoneStatusDisabled: true,
        isSipRegistered: true,
      }),
    ).toBe("Статус телефона недоступен");
  });

  it("returns registration reason when SIP is not registered", () => {
    expect(
      mapAvatarMenuDndDisabledReason({
        phoneStatusDisabled: false,
        isSipRegistered: false,
      }),
    ).toBe("Не зарегистрирован");
  });

  it("prefers phone status reason over registration reason", () => {
    expect(
      mapAvatarMenuDndDisabledReason({
        phoneStatusDisabled: true,
        isSipRegistered: false,
      }),
    ).toBe("Статус телефона недоступен");
  });
});
