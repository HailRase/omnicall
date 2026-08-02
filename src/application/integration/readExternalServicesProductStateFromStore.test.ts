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

  it("falls back to OCP authenticated login when SIP username is absent", () => {
    const profileKey = createSettingsAccountKey("agent@ocp.example");

    expect(
      readExternalServicesProductStateFromStore({
        projection: {
          hasActiveAccountSession: true,
          profileKey,
          sipUsername: null,
        },
        callFocusProjection: { focusedCallId: null },
        ocpSessionProjection: { authenticatedLogin: "ocp.agent" },
      }),
    ).toEqual({
      profileKey,
      focusedCallId: null,
      userLogin: "ocp.agent",
    });
  });

  it("prefers SIP username over OCP authenticated login", () => {
    const profileKey = createSettingsAccountKey("1001@pbx.example");

    expect(
      readExternalServicesProductStateFromStore({
        projection: {
          hasActiveAccountSession: true,
          profileKey,
          sipUsername: "1001",
        },
        callFocusProjection: { focusedCallId: null },
        ocpSessionProjection: { authenticatedLogin: "ocp.agent" },
      }),
    ).toEqual({
      profileKey,
      focusedCallId: null,
      userLogin: "1001",
    });
  });
});
