/**
 * DI-01 dependency-boundary proof: Domain stays free of protocol/Zod/Electron/ws;
 * renderer stores and UI components do not import SDK gateway ports.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const FORBIDDEN_DOMAIN_PATTERNS = [
  /from\s+["']@axata\/axatalk-protocol(?:\/[^"']*)?["']/,
  /from\s+["']zod(?:\/[^"']*)?["']/,
  /from\s+["']electron(?:\/[^"']*)?["']/,
  /from\s+["']ws(?:\/[^"']*)?["']/,
  /require\(\s*["']@axata\/axatalk-protocol/,
  /require\(\s*["']zod/,
  /require\(\s*["']electron/,
  /require\(\s*["']ws/,
] as const;

const FORBIDDEN_UI_GATEWAY_PATTERNS = [
  /ExternalClientGateway/,
  /MainToRendererBrokerPort/,
  /ExternalCommandHandler/,
  /ExternalQueryHandler/,
  /MockExternalClientGateway/,
  /MockMainToRendererBroker/,
  /from\s+["']@axata\/axatalk-protocol/,
] as const;

function listSourceFiles(rootDir: string, extensions: readonly string[]): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "dist") {
          continue;
        }
        walk(full);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        out.push(full);
      }
    }
  };
  walk(rootDir);
  return out.sort();
}

function collectViolations(
  files: readonly string[],
  patterns: readonly RegExp[],
): string[] {
  const violations: string[] = [];
  for (const file of files) {
    if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
      continue;
    }
    const source = fs.readFileSync(file, "utf8");
    for (const pattern of patterns) {
      if (pattern.test(source)) {
        violations.push(`${path.relative(repoRoot, file)} matches ${pattern}`);
      }
    }
  }
  return violations;
}

describe("DI-01 SDK dependency boundaries", () => {
  it("keeps Domain free of @axata/axatalk-protocol, zod, electron, and ws", () => {
    const domainFiles = listSourceFiles(path.join(repoRoot, "src/domain"), [
      ".ts",
    ]);
    expect(domainFiles.length).toBeGreaterThan(0);
    expect(collectViolations(domainFiles, FORBIDDEN_DOMAIN_PATTERNS)).toEqual(
      [],
    );
  });

  it("keeps renderer stores free of SDK gateway ports and protocol imports", () => {
    const storeFiles = listSourceFiles(
      path.join(repoRoot, "src/renderer/store"),
      [".ts", ".tsx"],
    );
    // Store folder may be empty or named differently; also scan common projection paths.
    const projectionFiles = listSourceFiles(
      path.join(repoRoot, "src/renderer"),
      [".ts", ".tsx"],
    ).filter((file) => {
      const rel = path.relative(path.join(repoRoot, "src/renderer"), file);
      return (
        rel.includes(`${path.sep}store${path.sep}`) ||
        rel.includes(`${path.sep}stores${path.sep}`) ||
        /(^|\/)use[A-Z].*Store\.tsx?$/.test(rel.split(path.sep).join("/"))
      );
    });
    const targets = [...new Set([...storeFiles, ...projectionFiles])];
    expect(targets.length).toBeGreaterThan(0);
    expect(
      collectViolations(targets, FORBIDDEN_UI_GATEWAY_PATTERNS),
    ).toEqual([]);
  });

  it("keeps renderer components free of SDK gateway ports", () => {
    const componentFiles = listSourceFiles(
      path.join(repoRoot, "src/renderer/components"),
      [".ts", ".tsx"],
    );
    expect(componentFiles.length).toBeGreaterThan(0);
    expect(
      collectViolations(componentFiles, FORBIDDEN_UI_GATEWAY_PATTERNS),
    ).toEqual([]);
  });
});
