import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { MockExternalClientGateway } from "./MockExternalClientGateway.js";

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../axatalk-sdk/packages/protocol/fixtures",
);

function readJson(relativePath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(fixturesRoot, relativePath), "utf8"),
  ) as unknown;
}

describe("MockExternalClientGateway", () => {
  it("reports mock status without opening sockets", () => {
    const gateway = new MockExternalClientGateway();
    expect(gateway.getStatus()).toBe("mock");
  });

  it("accepts a valid wire fixture and returns a typed message", () => {
    const gateway = new MockExternalClientGateway();
    const result = gateway.validateWireInbound(
      readJson("valid/command/get-snapshot.json"),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("command");
    }
  });

  it("accepts a valid discovery fixture", () => {
    const gateway = new MockExternalClientGateway();
    const result = gateway.validateDiscoveryInbound(
      readJson("valid/discovery/baseline.json"),
    );
    expect(result.success).toBe(true);
  });

  it("fails closed on unknown non-object input", () => {
    const gateway = new MockExternalClientGateway();
    expect(gateway.validateWireInbound("not-json-object").success).toBe(false);
    expect(gateway.validateWireInbound(null).success).toBe(false);
    expect(gateway.validateWireInbound(42).success).toBe(false);
    const stringResult = gateway.validateWireInbound("not-json-object");
    if (!stringResult.success) {
      expect(["invalid_message", "invalid_payload"]).toContain(stringResult.code);
    }
  });

  it("fails closed on invalid fixtures with stable meta codes", () => {
    const gateway = new MockExternalClientGateway();
    const result = gateway.validateWireInbound(
      readJson("invalid/command/unknown-type.json"),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("invalid_payload");
    }
  });

  it("does not expose Zod issue stacks on failure", () => {
    const gateway = new MockExternalClientGateway();
    const result = gateway.validateWireInbound({ kind: "nope" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result).sort()).toEqual(["code", "success"]);
      expect(result).not.toHaveProperty("error");
      expect(result).not.toHaveProperty("issues");
      expect(result).not.toHaveProperty("stack");
    }
  });
});
