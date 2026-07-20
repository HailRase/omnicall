/**
 * DI-01: consume SDK-02 golden fixtures byte-identical from
 * `axatalk-sdk/packages/protocol/fixtures/**` via `@axatalk/protocol` validators.
 * No translation, renaming, or local schema fork.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  findForbiddenWireKeys,
  isCommandAvailableInProductV1,
  productDenialCodeForCommand,
  validateDiscoveryDocument,
  validateWireMessage,
} from "@axatalk/protocol";
import { describe, expect, it } from "vitest";

const fixturesRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../axatalk-sdk/packages/protocol/fixtures",
);

function readJson(relativePath: string): unknown {
  const fullPath = path.join(fixturesRoot, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8")) as unknown;
}

function listJsonFiles(suiteRoot: string): string[] {
  const absolute = path.join(fixturesRoot, suiteRoot);
  if (!fs.existsSync(absolute)) {
    return [];
  }
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".json")) {
        out.push(path.relative(fixturesRoot, full).split(path.sep).join("/"));
      }
    }
  };
  walk(absolute);
  return out.sort();
}

describe("DI-01 protocol fixture consume (byte-identical SDK-02 corpus)", () => {
  it("resolves the shared fixtures root from the protocol package tree", () => {
    expect(fs.existsSync(fixturesRoot)).toBe(true);
    expect(fs.existsSync(path.join(fixturesRoot, "valid"))).toBe(true);
    expect(fs.existsSync(path.join(fixturesRoot, "invalid"))).toBe(true);
    expect(fs.existsSync(path.join(fixturesRoot, "meta"))).toBe(true);
  });

  it("accepts every valid fixture", () => {
    const files = listJsonFiles("valid");
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const value = readJson(file);
      if (file.includes("/discovery/")) {
        const result = validateDiscoveryDocument(value);
        expect(result.success, file).toBe(true);
      } else {
        const result = validateWireMessage(value);
        expect(result.success, file).toBe(true);
      }
      expect(findForbiddenWireKeys(value)).toEqual([]);
    }
  });

  it("rejects every invalid fixture with the documented meta code", () => {
    const files = listJsonFiles("invalid");
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const value = readJson(file);
      const metaRel = file
        .replace(/^invalid\//, "meta/")
        .replace(/\.json$/, ".meta.json");
      const meta = readJson(metaRel) as { expectedErrorCode: string };
      const result = file.includes("/discovery/")
        ? validateDiscoveryDocument(value)
        : validateWireMessage(value);
      expect(result.success, file).toBe(false);
      if (!result.success) {
        expect(result.code, file).toBe(meta.expectedErrorCode);
      }
    }
  });

  it("parses window:hide schema but marks it unavailable in v1 product surface", () => {
    const value = readJson("valid/command/window-hide-schema-only.json");
    const parsed = validateWireMessage(value);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.kind === "command") {
      expect(isCommandAvailableInProductV1(parsed.data.type)).toBe(false);
      expect(productDenialCodeForCommand(parsed.data.type)).toBe("forbidden");
    }
    const meta = readJson(
      "meta/command/window-hide-product-deny.meta.json",
    ) as { expectedErrorCode: string };
    expect(meta.expectedErrorCode).toBe("forbidden");
  });
});
