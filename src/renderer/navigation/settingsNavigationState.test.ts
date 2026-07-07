import { describe, expect, it } from "vitest";
import {
  createSettingsNavigationState,
  readSettingsReturnTo,
} from "./settingsNavigationState.js";

describe("settingsNavigationState", () => {
  it("reads validated settings return target from router state", () => {
    expect(readSettingsReturnTo({ settingsReturnTo: "/history" })).toBe("/history");
    expect(readSettingsReturnTo({ settingsReturnTo: " " })).toBeNull();
    expect(readSettingsReturnTo(null)).toBeNull();
  });

  it("captures current shell path when opening settings", () => {
    expect(createSettingsNavigationState("/contacts", null)).toEqual({
      settingsReturnTo: "/contacts",
    });
  });

  it("preserves original return target while switching settings sections", () => {
    expect(
      createSettingsNavigationState("/settings/sessions", {
        settingsReturnTo: "/history",
      }),
    ).toEqual({
      settingsReturnTo: "/history",
    });
  });
});
