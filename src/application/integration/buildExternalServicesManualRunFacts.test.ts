import { describe, expect, it } from "vitest";
import { createSettingsAccountKey } from "@domain/index.js";
import { buildExternalServicesManualRunFacts } from "./buildExternalServicesManualRunFacts.js";

describe("buildExternalServicesManualRunFacts", () => {
  it("returns empty facts when snapshot is unavailable", () => {
    expect(buildExternalServicesManualRunFacts(null)).toEqual({});
  });

  it("maps profile login and focused call id", () => {
    expect(
      buildExternalServicesManualRunFacts({
        profileKey: createSettingsAccountKey("agent@pbx.example"),
        focusedCallId: "call-9",
        userLogin: "agent",
      }),
    ).toEqual({
      userLogin: "agent",
      focusedCallContext: { callId: "call-9" },
    });
  });

  it("omits focused call when none is focused", () => {
    expect(
      buildExternalServicesManualRunFacts({
        profileKey: createSettingsAccountKey("agent@pbx.example"),
        focusedCallId: null,
        userLogin: "agent",
      }),
    ).toEqual({ userLogin: "agent" });
  });
});
