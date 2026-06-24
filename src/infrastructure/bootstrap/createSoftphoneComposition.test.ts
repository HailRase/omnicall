import { describe, expect, it } from "vitest";
import { createAccountBootstrap } from "./createAccountBootstrap.js";
import { createSoftphoneComposition } from "./createSoftphoneComposition.js";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";

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

  it("real mode returns AccountBootstrapFacade with JsSIP telephony wiring", () => {
    const facade = createSoftphoneComposition({
      mode: "real",
      bootstrapConfig: { mode: "sip-only" },
    });

    expect(facade).toBeInstanceOf(AccountBootstrapFacade);
    expect(typeof facade.registerAccount.execute).toBe("function");
    expect(typeof facade.authorizeManualAccount).toBe("function");
  });
});
