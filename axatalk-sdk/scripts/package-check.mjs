#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packages = [
  { dir: 'packages/protocol', name: '@axatalk/protocol' },
  { dir: 'packages/sdk', name: '@axatalk/sdk' }
];

const outDir = path.join(root, 'temp', 'tarballs');
fs.mkdirSync(outDir, { recursive: true });

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @returns {string}
 */
function runCapture(command, args, cwd) {
  console.log(`\n> ${command} ${args.join(' ')} (cwd=${path.relative(root, cwd) || '.'})`);
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || '');
    process.exit(result.status ?? 1);
  }
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 */
function run(command, args, cwd) {
  console.log(`\n> ${command} ${args.join(' ')} (cwd=${path.relative(root, cwd) || '.'})`);
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

/** @type {string[]} */
const tarballPaths = [];

for (const pkg of packages) {
  const pkgDir = path.join(root, pkg.dir);
  const packResult = spawnSync('npm', ['pack', '--pack-destination', outDir, '--json'], {
    cwd: pkgDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env
  });
  console.log(`\n> npm pack --pack-destination ${path.relative(root, outDir)} --json (cwd=${path.relative(root, pkgDir)})`);
  if (packResult.status !== 0) {
    process.stderr.write(packResult.stderr || packResult.stdout || '');
    process.exit(packResult.status ?? 1);
  }
  const packOutput = (packResult.stdout ?? '').trim();
  let parsed;
  try {
    parsed = JSON.parse(packOutput);
  } catch (error) {
    console.error('Failed to parse npm pack --json output:');
    console.error(packOutput);
    console.error(error);
    process.exit(1);
  }
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const filename = entries[0]?.filename;
  if (typeof filename !== 'string' || filename.length === 0) {
    console.error(`Failed to resolve tarball name for ${pkg.name}`);
    console.error(packOutput);
    process.exit(1);
  }
  const tarballPath = path.join(outDir, filename);
  if (!fs.existsSync(tarballPath)) {
    console.error(`Tarball not found: ${tarballPath}`);
    process.exit(1);
  }
  tarballPaths.push(tarballPath);

  run('npx', ['publint', tarballPath], root);
  // attw accepts an existing tarball path; --pack is only for packing a directory.
  // https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/packages/cli/README.md
  run('npx', ['attw', tarballPath, '--profile', 'esm-only'], root);

  const listing = runCapture('tar', ['-tzf', tarballPath], root);
  const files = listing
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const forbidden = files.filter(
    (file) =>
      file.includes('/src/') ||
      file.includes('/node_modules/') ||
      file.endsWith('.test.ts') ||
      file.endsWith('.test-d.ts') ||
      file.includes('.env')
  );
  if (forbidden.length > 0) {
    console.error(`Forbidden files in ${filename}:`);
    for (const file of forbidden) {
      console.error(`  - ${file}`);
    }
    process.exit(1);
  }

  const required = [`package/dist/index.js`, `package/dist/index.d.ts`, `package/package.json`];
  for (const req of required) {
    if (!files.includes(req)) {
      console.error(`Missing required packed file in ${filename}: ${req}`);
      process.exit(1);
    }
  }

  console.log(`\nTarball OK: ${path.relative(root, tarballPath)}`);
  console.log(`Contained files (${files.length}):`);
  for (const file of files) {
    console.log(`  ${file}`);
  }
}

const manifestPath = path.join(outDir, 'manifest.json');
fs.writeFileSync(
  manifestPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      publish: false,
      tarballs: tarballPaths.map((p) => path.relative(root, p))
    },
    null,
    2
  )}\n`
);

console.log(`\nWrote ${path.relative(root, manifestPath)}`);
console.log('package:check PASS (no publish performed)');
