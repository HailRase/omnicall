#!/usr/bin/env node
/**
 * Apply pending changesets (version + CHANGELOG). Does not publish.
 *
 * Usage:
 *   node ./scripts/release-version.mjs
 *
 * For first RC: ensure `.changeset/pre.json` exists (mode=pre, tag=rc).
 * For stable: run `npx changeset pre exit` first, then this script.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prePath = path.join(root, '.changeset', 'pre.json');

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

if (fs.existsSync(prePath)) {
  const pre = JSON.parse(fs.readFileSync(prePath, 'utf8'));
  console.log(`Prerelease mode: tag=${pre.tag ?? '?'} mode=${pre.mode ?? '?'}`);
} else {
  console.log('No .changeset/pre.json — stable (or non-pre) versioning.');
}

run('npx', ['changeset', 'version']);
console.log('\nrelease:version PASS — review CHANGELOG and package.json versions, then release:check');
