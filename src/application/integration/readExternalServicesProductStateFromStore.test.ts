import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "@domain/index.js";
import { readExternalServicesProductStateFromStore } from "./readExternalServicesProductStateFromStore.js";

describe("readExternalServicesProductStateFromStore", () => {
  it("maps committed profile identity and focused line", () => {
    const profileKey = createSettingsAccountKey("1001@pbx.example");

    expect(
      readExternalServicesProductStateFromStore({
        projection: {
          hasActiveAccountSession: true,
          profileKey,
          sipUsername: "1001",
        },
        callFocusProjection: { focusedCallId: "call-1" },
      }),
    ).toEqual({
      profileKey,
      focusedCallId: "call-1",
      userLogin: "1001",
    });
  });

  it("returns null when no active profile is available", () => {
    expect(
      readExternalServicesProductStateFromStore({
        projection: {
          hasActiveAccountSession: false,
          profileKey: null,
          sipUsername: null,
        },
        callFocusProjection: { focusedCallId: null },
      }),
    ).toBeNull();
  });
});
