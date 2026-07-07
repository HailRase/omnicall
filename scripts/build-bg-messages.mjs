/**
 * Generates Bulgarian i18n catalog from English source with per-key translations.
 * Run: node scripts/build-bg-messages.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { BG_FUNCTION_TEMPLATES } from "./bg-function-templates.mjs";

const ROOT = resolve(import.meta.dirname, "..");

/** @type {Readonly<Record<string, string>>} */
const BG_STRINGS = JSON.parse(
  readFileSync(resolve(ROOT, "src/renderer/i18n/locales/bg-strings.json"), "utf-8"),
);

function readEnCatalogKeys() {
  const content = readFileSync(resolve(ROOT, "src/renderer/i18n/messages.ts"), "utf-8");
  const enBlockMatch = content.match(/const enMessages: MessageShape = \{([\s\S]*?)\n\};/);
  if (!enBlockMatch) {
    throw new Error("Unable to locate enMessages block in messages.ts");
  }
  return [...enBlockMatch[1].matchAll(/"([^"]+)":/g)].map((match) => match[1]);
}

const allKeys = readEnCatalogKeys();
const functionKeys = new Set(Object.keys(BG_FUNCTION_TEMPLATES));

const stringKeys = allKeys.filter((key) => !functionKeys.has(key));
const missing = stringKeys.filter((key) => BG_STRINGS[key] === undefined);
if (missing.length > 0) {
  console.error(`Missing ${missing.length} bg translations:`, missing.slice(0, 10));
  process.exit(1);
}

const extra = Object.keys(BG_STRINGS).filter((key) => !allKeys.includes(key));
if (extra.length > 0) {
  console.error(`Extra bg keys:`, extra.slice(0, 10));
  process.exit(1);
}

const lines = [
  'import type { MessageShape } from "../messages.js";',
  "",
  "/**",
  " * - Purpose: Bulgarian UI translation catalog.",
  " * - Inputs: translation keys and interpolation params.",
  " * - Outputs: localized Bulgarian strings.",
  " */",
  "export const bgMessages: MessageShape = {",
];

for (const key of allKeys.sort((a, b) => a.localeCompare(b))) {
  if (functionKeys.has(key)) {
    const fn = BG_FUNCTION_TEMPLATES[key];
    if (!fn) {
      console.error(`Missing function template for ${key}`);
      process.exit(1);
    }
    lines.push(`  "${key}": ${fn},`);
    continue;
  }

  const value = BG_STRINGS[key];
  if (value.includes("\n")) {
    lines.push(`  "${key}":`, `    ${JSON.stringify(value)},`);
  } else {
    lines.push(`  "${key}": ${JSON.stringify(value)},`);
  }
}

lines.push("};", "");

const outPath = resolve(ROOT, "src/renderer/i18n/catalogs/bgMessages.ts");
writeFileSync(outPath, lines.join("\n"), "utf-8");
console.log(`Wrote ${outPath} (${allKeys.length} keys)`);
