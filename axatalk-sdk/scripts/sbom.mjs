#!/usr/bin/env node
/**
 * SDK-10 — generate CycloneDX SBOM for publishable workspace packages.
 * Writes under temp/sbom/ (gitignored). Does not publish.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'temp', 'sbom');
const workspaces = ['@axatalk/protocol', '@axatalk/sdk'];

fs.mkdirSync(outDir, { recursive: true });

/**
 * @param {string} workspace
 * @returns {string}
 */
function slug(workspace) {
  return workspace.replace('@', '').replace('/', '-');
}

for (const workspace of workspaces) {
  const outFile = path.join(outDir, `${slug(workspace)}.cyclonedx.json`);
  console.log(`\n> npm sbom --sbom-format cyclonedx -w ${workspace}`);
  const result = spawnSync(
    'npm',
    ['sbom', '--sbom-format', 'cyclonedx', '--omit', 'dev', '-w', workspace],
    {
      cwd: root,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      env: process.env
    }
  );
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || '');
    process.exit(result.status ?? 1);
  }
  const raw = (result.stdout ?? '').trim();
  if (raw.length === 0) {
    console.error(`Empty SBOM for ${workspace}`);
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error(`SBOM JSON parse failed for ${workspace}`);
    console.error(error);
    process.exit(1);
  }
  // Fail closed: never leave obvious secret-shaped strings in SBOM notes.
  const serialized = JSON.stringify(parsed);
  if (
    /sipPassword|apiKey|pairingSecret|privateKey|Bearer\s+[A-Za-z0-9\-._~+/]+=*/i.test(
      serialized
    )
  ) {
    console.error(`SBOM for ${workspace} contains forbidden secret-shaped content`);
    process.exit(1);
  }
  fs.writeFileSync(outFile, `${JSON.stringify(parsed, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, outFile)}`);
}

console.log('\nsbom PASS');
