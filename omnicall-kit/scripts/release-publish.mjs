#!/usr/bin/env node
/**
 * Authorized registry publish for @softomnitel/omnicall-protocol + @softomnitel/omnicall-kit.
 *
 * Usage:
 *   node ./scripts/release-publish.mjs rc
 *   node ./scripts/release-publish.mjs stable
 *
 * Requires:
 *   - RELEASE_CONFIRM=1
 *   - npm auth with write access to @softomnitel
 *   - packages flipped to private:false and versioned (changeset version)
 *   - publishConfig.access public (Free org) or restricted (Teams)
 *   - stable only after DI-10 / waiver
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];

/** @type {Record<string, { tag: string, requireDi10Gate: boolean }>} */
const modes = {
  rc: { tag: 'rc', requireDi10Gate: false },
  stable: { tag: 'latest', requireDi10Gate: true }
};

if (!mode || !(mode in modes)) {
  console.error('Usage: node ./scripts/release-publish.mjs <rc|stable>');
  process.exit(1);
}

if (process.env.RELEASE_CONFIRM !== '1') {
  console.error('Refusing publish: set RELEASE_CONFIRM=1 after human authorization.');
  process.exit(1);
}

if (modes[mode].requireDi10Gate && process.env.RELEASE_DI10_DONE !== '1') {
  console.error(
    'Stable publish: set RELEASE_DI10_DONE=1 (DI-10 full close 2026-07-27; still requires human Mode B confirm).'
  );
  process.exit(1);
}

const packages = [
  { dir: 'packages/protocol', name: '@softomnitel/omnicall-protocol' },
  { dir: 'packages/sdk', name: '@softomnitel/omnicall-kit' }
];

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} [cwd]
 */
function run(command, args, cwd = root) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/** @type {'public' | 'restricted'} */
let access = 'public';

for (const pkg of packages) {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(root, pkg.dir, 'package.json'), 'utf8'));
  if (pkgJson.private === true) {
    console.error(`${pkg.name}: private:true — flip to false before publish`);
    process.exit(1);
  }
  const pkgAccess = pkgJson.publishConfig?.access;
  if (pkgAccess !== 'public' && pkgAccess !== 'restricted') {
    console.error(`${pkg.name}: publishConfig.access must be "public" or "restricted"`);
    process.exit(1);
  }
  access = pkgAccess;
}

run('npm', ['run', 'release:check']);

const { tag } = modes[mode];
for (const pkg of packages) {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(root, pkg.dir, 'package.json'), 'utf8'));
  const pkgAccess = pkgJson.publishConfig?.access === 'restricted' ? 'restricted' : 'public';
  const args = ['publish', '-w', pkg.name, '--tag', tag, '--access', pkgAccess];
  if (pkgJson.publishConfig?.provenance === true) {
    args.push('--provenance');
  }
  run('npm', args, root);
}

console.log(`\nrelease:publish-${mode} PASS (tag=${tag}, access=${access})`);
