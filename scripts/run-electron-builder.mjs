/**
 * electron-builder wrapper for local and CI packaging.
 * Clears GitHub tokens so Actions does not trigger implicit publish (F-020 uses manual manifest).
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const platformArgs = process.argv.slice(2);
if (platformArgs.length === 0) {
  console.error('Usage: node scripts/run-electron-builder.mjs --win|--mac|--linux [extra electron-builder args]');
  process.exit(1);
}

const outputFlagIndex = platformArgs.findIndex((arg) => arg.startsWith('-c.directories.output='));
const outputDir =
  outputFlagIndex >= 0
    ? platformArgs[outputFlagIndex].slice('-c.directories.output='.length)
    : 'dist';

const filteredArgs = platformArgs.filter((_, index) => index !== outputFlagIndex);

const args = [
  ...filteredArgs,
  '--publish',
  'never',
  '--config',
  'electron-builder.yml',
  `-c.directories.output=${outputDir}`,
];

const env = {
  ...process.env,
  EPUBLISH: 'never',
  GH_TOKEN: '',
  GITHUB_TOKEN: '',
};

const result = spawnSync('npx', ['electron-builder', ...args], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env,
});

process.exit(result.status ?? 1);
