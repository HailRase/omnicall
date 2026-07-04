/**
 * One-time migration: camelCase CSS module selectors → kebab-case;
 * TS bracket access → dot notation (export keys via Vite localsConvention: camelCase).
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");

/** @param {string} className */
function toKebabCase(className) {
  return className
    .replace(/_/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

/** @param {string} kebab */
function toCamelExport(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
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

/** @param {string} css */
function extractClassNames(css) {
  const names = new Set();
  const re = /\.(?![\d-])([a-zA-Z_][\w-]*)/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const name = m[1];
    if (name !== "global") {
      names.add(name);
    }
  }
  return names;
}

/** @param {string} css @param {Map<string, string>} map old -> kebab */
function replaceCssClasses(css, map) {
  let result = css;
  const sorted = [...map.keys()].sort((a, b) => b.length - a.length);
  for (const oldName of sorted) {
    const kebab = map.get(oldName);
    if (kebab === oldName) {
      continue;
    }
    const re = new RegExp(`\\.${escapeRegExp(oldName)}(?![\\w-])`, "g");
    result = result.replace(re, `.${kebab}`);
  }
  return result;
}

/** @param {string} s */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** @param {string} exportKey */
function isValidDotKey(exportKey) {
  return /^[a-zA-Z_$][\w$]*$/.test(exportKey);
}

/** global export name map: old css class -> camel export */
const globalExportMap = new Map();

const cssFiles = walk(SRC).filter((f) => f.endsWith(".module.css"));
for (const file of cssFiles) {
  const css = readFileSync(file, "utf8");
  const classNames = extractClassNames(css);
  const localMap = new Map();

  for (const oldName of classNames) {
    const kebab = toKebabCase(oldName);
    const exportKey = toCamelExport(kebab);
    localMap.set(oldName, kebab);
    globalExportMap.set(oldName, exportKey);
  }

  const nextCss = replaceCssClasses(css, localMap);
  if (nextCss !== css) {
    writeFileSync(file, nextCss, "utf8");
    console.log(`CSS  ${relative(ROOT, file)}`);
  }
}

const tsFiles = walk(SRC).filter((f) => /\.(tsx?)$/.test(f));

/** @param {string} content @param {string} varName */
function transformStyleVarAccess(content, varName) {
  let result = content;

  const bracketRe = new RegExp(
    `${escapeRegExp(varName)}\\[("([^"]+)"|'([^']+)')\\]`,
    "g",
  );

  result = result.replace(bracketRe, (_match, _quote, dq, sq) => {
    const oldKey = dq ?? sq ?? "";
    const exportKey = globalExportMap.get(oldKey) ?? toCamelExport(toKebabCase(oldKey));
    if (!isValidDotKey(exportKey)) {
      return `${varName}["${exportKey}"]`;
    }
    return `${varName}.${exportKey}`;
  });

  const templateRe = new RegExp(
    `${escapeRegExp(varName)}\\[\\x60stateIndicator_\\$\\{tone\\}\\x60\\]`,
    "g",
  );
  result = result.replace(
    templateRe,
    `${varName}[STATE_INDICATOR_TONE_CLASS[tone]]`,
  );

  return result;
}

const styleVarNames = new Set(["styles"]);

for (const file of tsFiles) {
  let content = readFileSync(file, "utf8");
  const importRe =
    /import\s+(\w+)\s+from\s+["'][^"']+\.module\.css["']/g;
  let m;
  const localVars = new Set(["styles"]);
  while ((m = importRe.exec(content)) !== null) {
    localVars.add(m[1]);
  }

  let next = content;
  for (const varName of localVars) {
    next = transformStyleVarAccess(next, varName);
  }

  if (
    file.includes("SettingsSystemStatePanel.tsx") &&
    next.includes("STATE_INDICATOR_TONE_CLASS[tone]")
  ) {
    if (!next.includes("STATE_INDICATOR_TONE_CLASS")) {
      const insertAfter =
        'type StateIndicatorProps = Readonly<{\n  tone: SipStateIndicatorTone;\n  label: string;\n}>;\n';
      const mapBlock = `const STATE_INDICATOR_TONE_CLASS: Record<SipStateIndicatorTone, string> = {
  positive: styles.stateIndicatorPositive,
  progress: styles.stateIndicatorProgress,
  negative: styles.stateIndicatorNegative,
  neutral: styles.stateIndicatorNeutral,
};

`;
      next = next.replace(insertAfter, insertAfter + mapBlock);
    }
  }

  if (next !== content) {
    writeFileSync(file, next, "utf8");
    console.log(`TS   ${relative(ROOT, file)}`);
  }
}

console.log(`Done. CSS files: ${cssFiles.length}, export mappings: ${globalExportMap.size}`);
