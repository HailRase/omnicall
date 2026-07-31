import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createAccountBootstrap } from "./createAccountBootstrap.js";
import { createSoftphoneComposition } from "./createSoftphoneComposition.js";
import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(async (root) => {
      await rm(root, { recursive: true, force: true });
    }),
  );
});

describe("createSoftphoneComposition", () => {
  it("mock mode matches createAccountBootstrap behavior", () => {
    const viaAlias = createAccountBootstrap({
      bootstrapConfig: {},
      telephonyScenario: "success",
    });
    const viaComposition = createSoftphoneComposition({
      mode: "mock",
      bootstrapConfig: {},
      telephonyScenario: "success",
    });

    expect(viaComposition.constructor).toBe(viaAlias.constructor);
    expect(typeof viaComposition.initialize).toBe("function");
    expect(typeof viaComposition.dispose).toBe("function");
  });

  it("real mode returns AccountBootstrapFacade with JsSIP telephony wiring", async () => {
    const profilesStorageRoot = await mkdtemp(join(tmpdir(), "omnicall-composition-"));
    tempRoots.push(profilesStorageRoot);

    const facade = createSoftphoneComposition({
      mode: "real",
      profilesStorageRoot,
      filesystem: new NodeFileSystemAdapter(),
      bootstrapConfig: {},
    });

    expect(facade).toBeInstanceOf(AccountBootstrapFacade);
    expect(typeof facade.registerAccount.execute).toBe("function");
    expect(typeof facade.authorizeManualAccount).toBe("function");
    facade.dispose();
  });
});
