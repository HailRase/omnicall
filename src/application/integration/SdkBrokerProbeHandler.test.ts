import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SdkBrokerProbeHandler } from "./SdkBrokerProbeHandler.js";

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../axatalk-sdk/packages/protocol/fixtures",
);

function readJson(relativePath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesRoot, relativePath), "utf8"),
  ) as unknown;
}

describe("SdkBrokerProbeHandler", () => {
  it("handles sdk:ping once per call and echoes nonce", async () => {
    const handler = new SdkBrokerProbeHandler();
    const result = await handler.handleCommand(
      readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    );
    expect(result).toEqual({
      ok: true,
      result: { nonce: "nonce_ping_001" },
      revision: 1,
    });
    expect(handler.getHandleCount()).toBe(1);
  });

  it("rejects window:hide as unsupported_command on the probe (main-owned native path)", async () => {
    const handler = new SdkBrokerProbeHandler();
    await expect(
      handler.handleCommand(readJson("valid/command/window-hide-schema-only.json")),
    ).resolves.toMatchObject({ ok: false, code: "unsupported_command" });
    expect(handler.getHandleCount()).toBe(0);
  });

  it("fails closed on malformed input", async () => {
    const handler = new SdkBrokerProbeHandler();
    const result = await handler.handleCommand("bad");
    expect(result.ok).toBe(false);
  });
});
