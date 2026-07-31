import { describe, expect, it } from "vitest";
import { DeterministicUuidGenerator } from "./DeterministicUuidGenerator.js";
import { MockClock } from "./MockClock.js";
import { MockExternalServicesCollectionFileGateway } from "./MockExternalServicesCollectionFileGateway.js";

describe("External Services test support", () => {
  it("provides deterministic time and valid distinct UUID values", () => {
    const clock = new MockClock(new Date("2026-07-29T12:00:00.000Z"));
    const ids = new DeterministicUuidGenerator();

    clock.advanceBy(1_000);

    expect(clock.now().toISOString()).toBe("2026-07-29T12:00:01.000Z");
    expect(ids.generate()).toBe("00000000-0000-4000-8000-000000000001");
    expect(ids.generate()).toBe("00000000-0000-4000-8000-000000000002");
  });

  it("returns configured collection file dialog outcomes and captures exports", async () => {
    const gateway = new MockExternalServicesCollectionFileGateway({
      importContents: "{\"formatVersion\":1}",
      exportResult: { kind: "success", savedFileName: "" },
    });

    await expect(gateway.openImportDialog()).resolves.toEqual({
      kind: "success",
      contents: "{\"formatVersion\":1}",
    });
    await expect(
      gateway.saveExportDialog({
        contents: "{}",
        suggestedFileName: "collection.json",
      }),
    ).resolves.toEqual({ kind: "success", savedFileName: "collection.json" });
    expect(gateway.getLastExportInput()).toEqual({
      contents: "{}",
      suggestedFileName: "collection.json",
    });
  });
});
