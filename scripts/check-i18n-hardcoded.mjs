import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(".");

const CYRILLIC_SCAN_ROOTS = [
  "src/renderer",
  "src/application/projections",
  "src/renderer/helpers",
];

const ENGLISH_SCAN_ROOTS = ["src/renderer/components", "src/renderer/shells", "src/renderer/hooks", "src/renderer/helpers"];

const EXCLUDED = [
  /\/i18n\//,
  /\.test\.(ts|tsx)$/,
  /\.stories\.(ts|tsx)$/,
  /iconCatalog\.ts$/,
];

const LOCALIZED_STRING_RE = /(["'`])([^"'`\n]*[А-Яа-яЁё][^"'`\n]*)\1/g;
const HUMAN_ENGLISH_RE = /(["'`])([^"'`\n]*\b[A-Za-z]{3,}\s+[A-Za-z][^"'`\n]*)\1/g;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath.replace(/\\/g, "/"));
    }
  }
  return files;
}

function isExcluded(filePath) {
  return EXCLUDED.some((pattern) => pattern.test(filePath));
}

function collectViolations(filePath, regex) {
  const content = readFileSync(filePath, "utf-8");
  const violations = [];
  let match = regex.exec(content);
  while (match !== null) {
    const value = match[2];
    const skip =
      value.includes("data-testid") ||
      value.includes("${") ||
      value.startsWith("@") ||
      value.includes("typeof") ||
      value.includes("===") ||
      value.includes("prefers-reduced-motion") ||
      /^[a-z0-9_.:/-]+$/i.test(value);
    if (!skip) {
      violations.push(value);
    }
    match = regex.exec(content);
  }
  regex.lastIndex = 0;
  return violations;
}

function scanRoots(roots, regex) {
  const files = roots
    .flatMap((root) => walk(join(ROOT, root)))
    .filter((filePath) => !isExcluded(filePath));

  const allViolations = [];
  for (const filePath of files) {
    const values = collectViolations(filePath, regex);
    if (values.length === 0) {
      continue;
    }
    allViolations.push({ filePath, values: [...new Set(values)] });
  }
  return { files, allViolations };
}

const cyrillicScan = scanRoots(CYRILLIC_SCAN_ROOTS, LOCALIZED_STRING_RE);
const englishScan = scanRoots(ENGLISH_SCAN_ROOTS, HUMAN_ENGLISH_RE);

const merged = new Map();
for (const scan of [cyrillicScan, englishScan]) {
  for (const violation of scan.allViolations) {
    const existing = merged.get(violation.filePath) ?? new Set();
    for (const value of violation.values) {
      existing.add(value);
    }
    merged.set(violation.filePath, existing);
  }
}

if (merged.size > 0) {
  console.error("i18n hardcoded-string check failed:");
  for (const [filePath, values] of merged.entries()) {
    console.error(`- ${filePath}`);
    for (const value of values) {
      console.error(`  * ${value}`);
    }
  }
  process.exit(1);
}

const scannedCount = new Set([
  ...cyrillicScan.files,
  ...englishScan.files,
]).size;

console.log(`i18n hardcoded-string check passed (${scannedCount} files scanned).`);
