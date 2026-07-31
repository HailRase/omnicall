#!/usr/bin/env node
/**
 * SDK-10 — generate CycloneDX SBOM for publishable workspace packages.
 * Writes under temp/sbom/ (gitignored). Does not publish.
 *
 * Prefers `npm sbom` (npm ≥10). On older global npm, runs via `npx npm@10`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'temp', 'sbom');
const workspaces = ['@softomnitel/omnicall-protocol', '@softomnitel/omnicall-kit'];

fs.mkdirSync(outDir, { recursive: true });

/**
 * @param {string} workspace
 * @returns {string}
 */
function slug(workspace) {
  return workspace.replace('@', '').replace('/', '-');
}

/**
 * @param {string[]} args
 * @returns {{ status: number | null, stdout: string, stderr: string }}
 */
function runNpm(args) {
  return spawnSync('npm', args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env
  });
}

/**
 * @returns {{ command: string, prefixArgs: string[] }}
 */
function resolveSbomRunner() {
  const probe = runNpm(['sbom', '--help']);
  const helpText = `${probe.stdout ?? ''}${probe.stderr ?? ''}`;
  if (probe.status === 0 && !/Unknown command:\s*"sbom"/i.test(helpText)) {
    return { command: 'npm', prefixArgs: [] };
  }
  console.log('Local npm has no `sbom` command; using npx npm@10');
  return { command: 'npx', prefixArgs: ['--yes', 'npm@10'] };
}

const runner = resolveSbomRunner();

for (const workspace of workspaces) {
  const outFile = path.join(outDir, `${slug(workspace)}.cyclonedx.json`);
  const args = [
    ...runner.prefixArgs,
    'sbom',
    '--sbom-format',
    'cyclonedx',
    '--omit',
    'dev',
    '-w',
    workspace
  ];
  console.log(`\n> ${runner.command} ${args.join(' ')}`);
  const result = spawnSync(runner.command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env
  });
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
    process.stderr.write(`${raw.slice(0, 500)}\n`);
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
