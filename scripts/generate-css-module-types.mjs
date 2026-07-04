/**
 * Generates *.module.css.d.ts from kebab-case selectors (camelCase export keys).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");

/** @param {string} kebab */
function toCamelExport(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/** @param {string} css */
function extractKebabClassNames(css) {
  const names = new Set();
  const re = /\.(?![\d-])([a-z][a-z0-9-]*)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = m[1];
    if (name !== "global") {
      names.add(name);
    }
  }
  return names;
}

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

const cssFiles = walk(SRC).filter((f) => f.endsWith(".module.css"));
let generated = 0;

for (const cssFile of cssFiles) {
  const css = readFileSync(cssFile, "utf8");
  const kebabNames = [...extractKebabClassNames(css)].sort();
  const exportKeys = kebabNames.map((kebab) => toCamelExport(kebab));
  const uniqueKeys = [...new Set(exportKeys)].sort();

  const lines = uniqueKeys.map((key) => `  readonly ${key}: string;`);
  const dts = `declare const classes: {
${lines.join("\n")}
};
export default classes;
`;

  const dtsFile = `${cssFile}.d.ts`;
  writeFileSync(dtsFile, dts, "utf8");
  generated += 1;
  console.log(relative(ROOT, dtsFile));
}

console.log(`Generated ${generated} CSS module type files.`);
