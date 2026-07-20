import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SdkBrokerProbeHandler } from "@application/integration/SdkBrokerProbeHandler.js";

import { RendererSdkBrokerSession } from "./RendererSdkBrokerSession.js";

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../axatalk-sdk/packages/protocol/fixtures",
);

function readJson(relativePath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesRoot, relativePath), "utf8"),
  ) as unknown;
}

describe("RendererSdkBrokerSession", () => {
  it("returns not_ready when inactive", async () => {
    const session = new RendererSdkBrokerSession({
      handler: new SdkBrokerProbeHandler(),
      serverInstanceId: "srv_test",
      sessionEpoch: "epoch_test",
      createOccurredAt: () => "2026-07-20T10:00:00.000Z",
    });
    await expect(
      session.handleRequest({
        brokerRequestId: "brk_1",
        command: readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
      }),
    ).resolves.toEqual({
      brokerRequestId: "brk_1",
      ok: false,
      code: "not_ready",
    });
  });

  it("delivers sdk:ping to the Application handler and builds a reply", async () => {
    const handler = new SdkBrokerProbeHandler();
    const session = new RendererSdkBrokerSession({
      handler,
      serverInstanceId: "srv_test",
      sessionEpoch: "epoch_test",
      createOccurredAt: () => "2026-07-20T10:00:00.000Z",
    });
    session.markActive();

    const reply = await session.handleRequest({
      brokerRequestId: "brk_1",
      command: readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    });

    expect(handler.getHandleCount()).toBe(1);
    expect(reply.ok).toBe(true);
    if (reply.ok) {
      expect(reply.reply).toMatchObject({
        kind: "reply",
        ok: true,
        requestId: "req_ping_extra_001",
        commandType: "sdk:ping",
        serverInstanceId: "srv_test",
        sessionEpoch: "epoch_test",
        result: { nonce: "nonce_ping_001" },
      });
    }
  });

  it("fails closed on malformed IPC envelopes", async () => {
    const session = new RendererSdkBrokerSession({
      handler: new SdkBrokerProbeHandler(),
      serverInstanceId: "srv_test",
      sessionEpoch: "epoch_test",
    });
    session.markActive();
    await expect(session.handleRequest(null)).resolves.toEqual({
      brokerRequestId: "invalid",
      ok: false,
      code: "invalid_message",
    });
  });
});
