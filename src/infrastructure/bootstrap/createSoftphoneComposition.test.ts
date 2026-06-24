import { describe, expect, it } from "vitest";
import { createAccountBootstrap } from "./createAccountBootstrap.js";
import { createSoftphoneComposition } from "./createSoftphoneComposition.js";
import { RealAdapterBootstrapNotReadyError } from "./createRealAccountBootstrap.js";

describe("createSoftphoneComposition", () => {
  it("mock mode matches createAccountBootstrap behavior", () => {
    const viaAlias = createAccountBootstrap({
      bootstrapConfig: { mode: "sip-only" },
      telephonyScenario: "success",
    });
    const viaComposition = createSoftphoneComposition({
      mode: "mock",
      bootstrapConfig: { mode: "sip-only" },
      telephonyScenario: "success",
    });

    expect(viaComposition.constructor).toBe(viaAlias.constructor);
    expect(typeof viaComposition.initialize).toBe("function");
    expect(typeof viaComposition.dispose).toBe("function");
  });

  it("real mode throws typed stub error without crashing the caller", () => {
    expect(() =>
      createSoftphoneComposition({
        mode: "real",
        bootstrapConfig: { mode: "sip-only" },
      }),
    ).toThrow(RealAdapterBootstrapNotReadyError);

    try {
      createSoftphoneComposition({
        mode: "real",
        bootstrapConfig: { mode: "sip-only" },
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RealAdapterBootstrapNotReadyError);
      if (error instanceof RealAdapterBootstrapNotReadyError) {
        expect(error.code).toBe("REAL_ADAPTER_BOOTSTRAP_NOT_READY");
      }
    }
  });
});
