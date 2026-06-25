#!/usr/bin/env node
/**
 * Generates docs/softphone/UI-Component-Catalog.md from renderer TSX sources.
 * Scans: exported component names, *Props types, data-testid, @uiMeta JSDoc.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const RENDERER = join(ROOT, "src", "renderer");
const OUT = join(ROOT, "docs", "softphone", "UI-Component-Catalog.md");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      files.push(...(await walk(full)));
    } else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) {
      files.push(full);
    }
  }
  return files;
}

function parseFile(content, path) {
  const nameMatch = content.match(/export function (\w+)/);
  if (!nameMatch) return null;
  const name = nameMatch[1];
  const propsMatch = content.match(/export type (\w+Props)/);
  const testIds = [...content.matchAll(/data-testid="([^"]+)"/g)].map((m) => m[1]);
  const uiMetaMatch = content.match(/@uiMeta\s+([^\n*]+)/);
  return {
    name,
    path: relative(ROOT, path).replaceAll("\\", "/"),
    props: propsMatch?.[1] ?? "—",
    testIds: testIds.length > 0 ? testIds.join(", ") : "—",
    uiMeta: uiMetaMatch?.[1].trim() ?? "—",
  };
}

const files = await walk(RENDERER);
const rows = [];
for (const file of files.sort()) {
  const content = await readFile(file, "utf8");
  const row = parseFile(content, file);
  if (row) rows.push(row);
}

const table = rows
  .map(
    (r) =>
      `| \`${r.name}\` | \`${r.path}\` | \`${r.props}\` | ${r.testIds} | ${r.uiMeta} |`,
  )
  .join("\n");

const md = `# UI Component Catalog

> **Auto-generated.** Do not edit by hand. Run: \`npm run ui:catalog\`

## Index

| Component | Path | Exported props | Test IDs | @uiMeta |
| --- | --- | --- | --- | --- |
${table}

## Usage

- Agents: read this file for renderer component map and smoke test IDs.
- Developers: add \`@uiMeta lf=… f=… smoke=…\` to component JSDoc; re-run catalog.
- Storybook: \`npm run storybook\` for visual states.
`;

await writeFile(OUT, md, "utf8");
console.log(`Wrote ${rows.length} components to ${relative(ROOT, OUT)}`);
