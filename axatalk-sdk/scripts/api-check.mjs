#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packages = ['protocol', 'sdk'];

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

const reportDir = path.join(root, 'etc', 'api');
const tempDir = path.join(root, 'temp', 'api');
fs.mkdirSync(reportDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

for (const name of packages) {
  const pkgDir = path.join(root, 'packages', name);
  const distEntry = path.join(pkgDir, 'dist', 'index.d.ts');
  if (!fs.existsSync(distEntry)) {
    console.error(`Missing build output for @axatalk/${name}: ${distEntry}`);
    console.error('Run `npm run build` before api:check.');
    process.exit(1);
  }
  run(
    'npx',
    ['api-extractor', 'run', '--local', '--verbose', '--typescript-compiler-folder', path.join(root, 'node_modules', 'typescript')],
    pkgDir
  );
}

for (const name of packages) {
  const reportPath = path.join(reportDir, `${name}.api.md`);
  if (!fs.existsSync(reportPath)) {
    console.error(`API report missing: ${reportPath}`);
    process.exit(1);
  }
  const report = fs.readFileSync(reportPath, 'utf8');
  if (!report.includes('(No exports were found that belong to package')) {
    // Empty package still produces a report; accept either no-exports wording or empty export table.
    if (report.includes('export ') && !report.includes('export {}')) {
      const publicSymbols = [...report.matchAll(/^\s*(export\s+(?:declare\s+)?(?:class|function|const|interface|type|enum)\s+\w+)/gm)];
      if (publicSymbols.length > 0) {
        console.error(`Unexpected public API symbols in ${reportPath}`);
        process.exit(1);
      }
    }
  }
  console.log(`API report OK (no public production surface): ${path.relative(root, reportPath)}`);
}

console.log('\napi:check PASS');
