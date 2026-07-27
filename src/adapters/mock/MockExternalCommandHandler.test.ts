import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  MockExternalCommandHandler,
  MockExternalQueryHandler,
} from "./MockExternalCommandHandler.js";

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../axatalk-sdk/packages/protocol/fixtures",
);

function readJson(relativePath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesRoot, relativePath), "utf8"),
  ) as unknown;
}

describe("MockExternalCommandHandler / MockExternalQueryHandler", () => {
  it("command handler fails closed on unknown input", async () => {
    const handler = new MockExternalCommandHandler();
    await expect(handler.handleCommand(undefined)).resolves.toEqual({
      ok: false,
      code: "invalid_message",
      retryable: false,
    });
  });

  it("command handler accepts sdk:ping and returns typed DTO", async () => {
    const handler = new MockExternalCommandHandler();
    const result = await handler.handleCommand(
      readJson("valid/command/sdk-ping-unknown-key-stripped.json"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result).toEqual({});
      expect(result.revision).toBe(1);
    }
    expect(handler.getHandledTypes()).toEqual(["sdk:ping"]);
  });

  it("command handler rejects snapshot queries", async () => {
    const handler = new MockExternalCommandHandler();
    await expect(
      handler.handleCommand(readJson("valid/command/get-snapshot.json")),
    ).resolves.toEqual({
      ok: false,
      code: "unsupported_command",
      retryable: false,
    });
  });

  it("query handler accepts get-snapshot", async () => {
    const handler = new MockExternalQueryHandler();
    const result = await handler.handleQuery(
      readJson("valid/command/get-snapshot.json"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.revision).toBe(1);
    }
    expect(handler.getHandledTypes()).toEqual(["sdk:get-snapshot"]);
  });

  it("query handler rejects mutating call commands", async () => {
    const handler = new MockExternalQueryHandler();
    await expect(
      handler.handleQuery(readJson("valid/command/call-originate.json")),
    ).resolves.toEqual({
      ok: false,
      code: "unsupported_command",
      retryable: false,
    });
  });

  it("command handler accepts window:hide as product-available (native path is gateway)", async () => {
    const handler = new MockExternalCommandHandler();
    await expect(
      handler.handleCommand(
        readJson("valid/command/window-hide-schema-only.json"),
      ),
    ).resolves.toMatchObject({ ok: true });
    expect(handler.getHandledTypes()).toEqual(["window:hide"]);
  });
});
