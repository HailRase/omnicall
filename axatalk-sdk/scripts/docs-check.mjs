#!/usr/bin/env node
/**
 * SDK-09 docs/example checks: typecheck example project + secret/privilege scan.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const guideRoot = path.join(root, 'docs', 'guide');
const exampleSrc = path.join(root, 'examples', 'crm-pairing-lite', 'src');

/**
 * @param {string} command
 * @param {string[]} args
 */
function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/**
 * @param {string} dir
 * @param {string} suffix
 * @returns {string[]}
 */
function listFiles(dir, suffix) {
  /** @type {string[]} */
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      out.push(...listFiles(full, suffix));
    } else if (full.endsWith(suffix)) {
      out.push(full);
    }
  }
  return out;
}

const requiredGuide = [
  'README.md',
  'installation.md',
  'pairing-quick-start.md',
  'api-reference.md',
  'events.md',
  'errors.md',
  'capabilities.md',
  'reconnect-multi-tab.md',
  'logout-workflow.md',
  'saved-profile-activation.md',
  'security-anti-patterns.md',
  'upgrade-deprecation.md',
  'compatibility-matrix.md',
  'release-and-support.md'
];

for (const name of requiredGuide) {
  const full = path.join(guideRoot, name);
  if (!fs.existsSync(full)) {
    console.error(`Missing guide page: ${name}`);
    process.exit(1);
  }
}

const exampleFiles = listFiles(exampleSrc, '.ts');
if (exampleFiles.length === 0) {
  console.error('No example TypeScript files found');
  process.exit(1);
}

for (const file of exampleFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  if (/localStorage|sessionStorage|sipPassword|\bapiKey\b|\bpassword\s*:/.test(text)) {
    console.error(`Forbidden secret/storage pattern in ${rel}`);
    process.exit(1);
  }
  if (/requestedCapabilities:\s*\[[^\]]*'account\.activate'/s.test(text)) {
    console.error(`Example teaches requesting account.activate at pairing: ${rel}`);
    process.exit(1);
  }
  if (/requestedCapabilities:\s*\[[^\]]*'window\.hide'/s.test(text)) {
    console.error(`Example teaches requesting window.hide at pairing: ${rel}`);
    process.exit(1);
  }
}

const quickStart = fs.readFileSync(path.join(guideRoot, 'pairing-quick-start.md'), 'utf8');
if (/account\.activate|window\.hide|localStorage|sessionStorage|sipPassword/.test(quickStart)) {
  console.error('pairing-quick-start.md fails secure-default scan');
  process.exit(1);
}

const apiReport = fs.readFileSync(path.join(root, 'etc', 'api', 'sdk.api.md'), 'utf8');
const reportExports = [...apiReport.matchAll(/^export (?:type|class|function|const) (\w+)/gm)].map(
  (match) => match[1]
);
if (reportExports.length !== 48) {
  console.error(`Expected 48 sdk.api.md exports, found ${reportExports.length}`);
  process.exit(1);
}

const apiReference = fs.readFileSync(path.join(guideRoot, 'api-reference.md'), 'utf8');
const inventoryMatch = apiReference.match(
  /## Public symbol inventory \(48\)([\s\S]*?)## Factories/
);
if (!inventoryMatch) {
  console.error('api-reference.md missing Public symbol inventory (48) section');
  process.exit(1);
}
const inventoryExports = [...inventoryMatch[1].matchAll(/`(\w+)`/g)].map((match) => match[1]);
if (inventoryExports.length !== 48) {
  console.error(`api-reference inventory has ${inventoryExports.length} symbols, expected 48`);
  process.exit(1);
}
const sortedReport = [...reportExports].sort().join(',');
const sortedInventory = [...inventoryExports].sort().join(',');
if (sortedReport !== sortedInventory) {
  console.error('api-reference inventory does not match etc/api/sdk.api.md exports');
  process.exit(1);
}

run('npx', ['tsc', '-p', 'examples/crm-pairing-lite/tsconfig.json', '--pretty', 'false']);

console.log('\ndocs:check PASS (example typecheck + secret scan + API inventory)');

