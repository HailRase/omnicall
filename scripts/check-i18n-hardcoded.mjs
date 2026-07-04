import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const INCLUDED = [
  /^src\/renderer\/.*\.(ts|tsx)$/,
  /^src\/application\/projections\/.*\.(ts|tsx)$/,
  /^src\/renderer\/helpers\/.*\.(ts|tsx)$/,
];

const EXCLUDED = [
  /\/i18n\//,
  /\.test\.(ts|tsx)$/,
  /\.stories\.(ts|tsx)$/,
  /iconCatalog\.ts$/,
];

const LOCALIZED_STRING_RE = /(["'`])([^"'`\n]*[А-Яа-яЁё][^"'`\n]*)\1/g;
const HUMAN_ENGLISH_RE = /(["'`])([^"'`\n]*\b[A-Za-z]{3,}\s+[A-Za-z][^"'`\n]*)\1/g;

function getChangedFiles() {
  const raw = execSync("git diff --name-only --diff-filter=ACMRTUXB HEAD", {
    encoding: "utf-8",
  }).trim();
  if (raw.length === 0) {
    return [];
  }
  return raw.split(/\r?\n/).filter((entry) => entry.length > 0);
}

function isIncluded(filePath) {
  return INCLUDED.some((pattern) => pattern.test(filePath));
}

function isExcluded(filePath) {
  return EXCLUDED.some((pattern) => pattern.test(filePath));
}

function collectViolations(filePath, regex) {
  const content = readFileSync(resolve(filePath), "utf-8");
  const violations = [];
  let match = regex.exec(content);
  while (match !== null) {
    const value = match[2];
    const skip =
      value.includes("data-testid") ||
      value.includes("${") ||
      value.startsWith("@") ||
      /^[a-z0-9_.:/-]+$/i.test(value);
    if (!skip) {
      violations.push(value);
    }
    match = regex.exec(content);
  }
  regex.lastIndex = 0;
  return violations;
}

const changedFiles = getChangedFiles().filter(
  (filePath) => isIncluded(filePath) && !isExcluded(filePath),
);

const allViolations = [];
for (const filePath of changedFiles) {
  const localized = collectViolations(filePath, LOCALIZED_STRING_RE);
  const english = collectViolations(filePath, HUMAN_ENGLISH_RE);
  if (localized.length === 0 && english.length === 0) {
    continue;
  }
  allViolations.push({
    filePath,
    values: [...new Set([...localized, ...english])],
  });
}

if (allViolations.length > 0) {
  console.error("i18n hardcoded-string check failed:");
  for (const violation of allViolations) {
    console.error(`- ${violation.filePath}`);
    for (const value of violation.values) {
      console.error(`  * ${value}`);
    }
  }
  process.exit(1);
}

console.log("i18n hardcoded-string check passed.");
