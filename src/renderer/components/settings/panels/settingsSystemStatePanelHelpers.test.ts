import { describe, expect, it } from "vitest";
import {
  deriveRegistrationIndicatorTone,
  deriveSummaryIndicatorTone,
  deriveTransportIndicatorTone,
  isIntervalBelowMinimum,
} from "./settingsSystemStatePanelHelpers.js";

describe("settingsSystemStatePanelHelpers", () => {
  it("maps transport states to indicator tones", () => {
    expect(deriveTransportIndicatorTone("connected")).toBe("positive");
    expect(deriveTransportIndicatorTone("reconnecting")).toBe("progress");
    expect(deriveTransportIndicatorTone("disconnected")).toBe("negative");
    expect(deriveTransportIndicatorTone("idle")).toBe("neutral");
  });

  it("maps registration states to indicator tones", () => {
    expect(deriveRegistrationIndicatorTone("registered")).toBe("positive");
    expect(deriveRegistrationIndicatorTone("registering")).toBe("progress");
    expect(deriveRegistrationIndicatorTone("failed")).toBe("negative");
  });

  it("derives summary tone from transport and registration", () => {
    expect(deriveSummaryIndicatorTone("connected", "registered")).toBe("positive");
    expect(deriveSummaryIndicatorTone("disconnected", "idle")).toBe("negative");
  });

  it("detects interval below minimum", () => {
    expect(isIntervalBelowMinimum(4, 5)).toBe(true);
    expect(isIntervalBelowMinimum(5, 5)).toBe(false);
  });
});
