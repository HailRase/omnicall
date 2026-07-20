import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { MockMainToRendererBroker } from "./MockMainToRendererBroker.js";

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../axatalk-sdk/packages/protocol/fixtures",
);

function readJson(relativePath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesRoot, relativePath), "utf8"),
  ) as unknown;
}

describe("MockMainToRendererBroker", () => {
  it("returns not_ready until the composition signals readiness", async () => {
    const broker = new MockMainToRendererBroker();
    expect(broker.isReady()).toBe(false);
    await expect(
      broker.request(readJson("valid/command/sdk-ping-unknown-key-stripped.json")),
    ).resolves.toEqual({ ok: false, code: "not_ready" });
  });

  it("fails closed on unknown input when ready", async () => {
    const broker = new MockMainToRendererBroker();
    broker.setReady(true);
    const result = await broker.request("bad");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(["invalid_message", "invalid_payload"]).toContain(result.code);
    }
  });

  it("returns a typed success reply for a valid available command", async () => {
    const broker = new MockMainToRendererBroker();
    broker.setReady(true);
    const result = await broker.request(
      readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reply.ok).toBe(true);
      expect(result.reply.commandType).toBe("sdk:ping");
      expect(result.reply.requestId).toBe("req_ping_extra_001");
      expect(result.reply.occurredAt).toBe("2026-07-20T10:00:00.000Z");
    }
    expect(broker.getHandledRequestIds()).toEqual(["req_ping_extra_001"]);
    expect(broker.getHandledRequests()).toEqual([
      {
        requestId: "req_ping_extra_001",
        commandType: "sdk:ping",
        payload: { nonce: "nonce_ping_001" },
      },
    ]);
  });

  it("denies window:hide on the v1 product surface", async () => {
    const broker = new MockMainToRendererBroker();
    broker.setReady(true);
    await expect(
      broker.request(readJson("valid/command/window-hide-schema-only.json")),
    ).resolves.toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects non-command wire messages", async () => {
    const broker = new MockMainToRendererBroker();
    broker.setReady(true);
    await expect(
      broker.request(readJson("valid/event/call-incoming.json")),
    ).resolves.toEqual({ ok: false, code: "invalid_message" });
  });
});
