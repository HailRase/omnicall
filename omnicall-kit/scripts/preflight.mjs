#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

run('npm', ['run', 'lint']);
run('npm', ['run', 'typecheck']);
run('npm', ['run', 'build']);
run('npm', ['run', 'test']);
run('npm', ['run', 'test:types']);
run('npm', ['run', 'test:browser']);
run('npm', ['run', 'api:check']);
run('npm', ['run', 'package:check']);
run('npm', ['run', 'docs:check']);

console.log('\nSDK preflight PASS');
