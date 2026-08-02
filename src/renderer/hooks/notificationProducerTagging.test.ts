/**
 * - Purpose: assert F-034 producer notify literals include module/functionId/interruptClass.
 * - Inputs: all non-test/non-story TypeScript sources under src/renderer.
 * - Outputs: empty violation list when every inline notify object is tagged.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

const RENDERER_ROOT = path.join(repoRoot, "src/renderer");

const NOTIFY_OBJECT_START =
  /(?:notifications\.)?notify(?:\?\.)?\(\{|NotificationDescriptor\s*=\s*\{/g;

const SKIP_PATH_FRAGMENT = /(\.|\/|\\)(test|stories|spec)(\.|\/|\\)/i;

function listRendererSourceFiles(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listRendererSourceFiles(absolutePath));
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }
    if (/\.(test|stories|spec)\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }
    const relativePath = path.relative(repoRoot, absolutePath).replace(/\\/g, "/");
    if (SKIP_PATH_FRAGMENT.test(relativePath)) {
      continue;
    }
    files.push(relativePath);
  }
  return files;
}

function extractBalancedObject(source: string, openBraceIndex: number): string {
  let depth = 0;
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
      continue;
    }
    if (char !== "}") {
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return source.slice(openBraceIndex, index + 1);
    }
  }
  return source.slice(openBraceIndex);
}

function collectUntaggedNotifyObjects(
  relativePath: string,
  source: string,
): string[] {
  const violations: string[] = [];
  NOTIFY_OBJECT_START.lastIndex = 0;
  let match = NOTIFY_OBJECT_START.exec(source);
  while (match !== null) {
    const openBraceIndex = source.indexOf("{", match.index);
    if (openBraceIndex < 0) {
      break;
    }
    const objectLiteral = extractBalancedObject(source, openBraceIndex);
    const hasModule = /\bmodule\s*:/.test(objectLiteral);
    const hasFunctionId = /\bfunctionId\s*:/.test(objectLiteral);
    const hasInterruptClass = /\binterruptClass\s*:/.test(objectLiteral);
    if (!hasModule || !hasFunctionId || !hasInterruptClass) {
      const line = source.slice(0, openBraceIndex).split("\n").length;
      violations.push(
        `${relativePath}:${line} missing ${[
          !hasModule ? "module" : null,
          !hasFunctionId ? "functionId" : null,
          !hasInterruptClass ? "interruptClass" : null,
        ]
          .filter((part): part is string => part !== null)
          .join(", ")}`,
      );
    }
    match = NOTIFY_OBJECT_START.exec(source);
  }
  return violations;
}

describe("F-034 notification producer tagging", () => {
  it("requires module, functionId, and interruptClass on all renderer notify literals", () => {
    expect(fs.existsSync(RENDERER_ROOT)).toBe(true);
    const sourceFiles = listRendererSourceFiles(RENDERER_ROOT);
    expect(sourceFiles.length).toBeGreaterThan(20);

    const violations = sourceFiles.flatMap((relativePath) => {
      const absolutePath = path.join(repoRoot, relativePath);
      return collectUntaggedNotifyObjects(
        relativePath,
        fs.readFileSync(absolutePath, "utf8"),
      );
    });

    expect(violations).toEqual([]);
  });
});
