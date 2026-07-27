#!/usr/bin/env node
/**
 * Flip publishable packages from private:true → private:false (or reverse with --lock).
 * Example apps stay private. Does not version or publish.
 *
 * Usage:
 *   node ./scripts/release-prepare-publishable.mjs
 *   node ./scripts/release-prepare-publishable.mjs --lock
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = process.argv.includes('--lock');
const nextPrivate = lock;

const targets = ['packages/protocol/package.json', 'packages/sdk/package.json'];

for (const rel of targets) {
  const full = path.join(root, rel);
  const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
  pkg.private = nextPrivate;
  fs.writeFileSync(full, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`${pkg.name}: private=${pkg.private}`);
}

console.log(
  lock
    ? '\nrelease:prepare --lock PASS (packages private again)'
    : '\nrelease:prepare PASS (packages publishable; run release:version / release:publish-*)'
);
