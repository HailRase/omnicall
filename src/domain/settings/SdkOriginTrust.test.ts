import { describe, expect, it } from "vitest";
import {
  createDefaultSdkOriginCapabilityMatrix,
  normalizeSdkOriginCallMatrix,
  withMatrixCapability,
} from "./SdkOriginTrust.js";

describe("SdkOriginTrust matrix (ADR-0021)", () => {
  it("mirrors granular when toggling call.control umbrella", () => {
    const base = createDefaultSdkOriginCapabilityMatrix();
    const off = withMatrixCapability(base, "call.control", false);
    expect(off.capabilities["call.answer"]).toBe(false);
    expect(off.capabilities["call.mute"]).toBe(false);
    const on = withMatrixCapability(off, "call.control", true);
    expect(on.capabilities["call.hangup"]).toBe(true);
    expect(on.capabilities["call.hold"]).toBe(true);
  });

  it("sets umbrella from AND of granular toggles", () => {
    const base = createDefaultSdkOriginCapabilityMatrix();
    const partial = withMatrixCapability(base, "call.mute", false);
    expect(partial.capabilities["call.control"]).toBe(false);
    expect(partial.capabilities["call.answer"]).toBe(true);
    const restored = withMatrixCapability(partial, "call.mute", true);
    expect(restored.capabilities["call.control"]).toBe(true);
  });

  it("normalize clears umbrella when any granular is false (no silent enable)", () => {
    const inconsistent = {
      capabilities: {
        ...createDefaultSdkOriginCapabilityMatrix().capabilities,
        "call.control": true,
        "call.hold": false,
      },
    };
    const normalized = normalizeSdkOriginCallMatrix(inconsistent);
    expect(normalized.capabilities["call.control"]).toBe(false);
    expect(normalized.capabilities["call.hold"]).toBe(false);
    expect(normalized.capabilities["call.mute"]).toBe(true);
  });
});
