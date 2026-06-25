#!/usr/bin/env node
/**
 * Verifies Feature Registry evidence paths exist on disk.
 * Scans docs/softphone/Feature-Registry.md for `src/...` backtick paths.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const REGISTRY = join(ROOT, "docs", "softphone", "Feature-Registry.md");

const content = await readFile(REGISTRY, "utf8");
const pathPattern = /`(src\/[^`]+)`/g;
const paths = new Set();
let match = pathPattern.exec(content);
while (match !== null) {
  const raw = match[1].replace(/\s*\(.*$/, "").trim();
  paths.add(raw);
  match = pathPattern.exec(content);
}

const missing = [];
const found = [];
for (const rel of [...paths].sort()) {
  const full = join(ROOT, rel);
  if (existsSync(full)) {
    found.push(rel);
  } else {
    missing.push(rel);
  }
}

console.log(`Feature Registry path check: ${found.length} found, ${missing.length} missing`);
if (missing.length > 0) {
  console.error("\nMissing paths:");
  for (const p of missing) {
    console.error(`  ✗ ${p}`);
  }
  process.exit(1);
}
console.log("All registry src/ evidence paths exist.");
