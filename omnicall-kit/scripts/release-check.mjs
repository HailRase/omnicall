#!/usr/bin/env node
/**
 * SDK-10 — release readiness check (no registry publish).
 * Verifies publishConfig, reuses package:check fortress, SBOM, and publish dry-run.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packages = [
  { dir: 'packages/protocol', name: '@softomnitel/omnicall-protocol' },
  { dir: 'packages/sdk', name: '@softomnitel/omnicall-kit' }
];

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} [cwd]
 * @param {{ inherit?: boolean }} [opts]
 * @returns {{ status: number | null, stdout: string, stderr: string }}
 */
function run(command, args, cwd = root, opts = {}) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
    stdio: opts.inherit ? 'inherit' : 'pipe'
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? ''
  };
}

for (const pkg of packages) {
  const pkgJsonPath = path.join(root, pkg.dir, 'package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const publishConfig = pkgJson.publishConfig ?? {};
  if (publishConfig.access !== 'public' && publishConfig.access !== 'restricted') {
    console.error(`${pkg.name}: publishConfig.access must be "public" or "restricted"`);
    process.exit(1);
  }
  if (publishConfig.provenance !== true && publishConfig.provenance !== false) {
    console.error(`${pkg.name}: publishConfig.provenance must be true (CI) or false (local CLI)`);
    process.exit(1);
  }
  if (pkg.name === '@softomnitel/omnicall-kit') {
    const files = pkgJson.files ?? [];
    const allowed = new Set(['dist', 'LICENSE', 'README.md']);
    for (const entry of files) {
      if (!allowed.has(entry)) {
        console.error(`@softomnitel/omnicall-kit files entry not allowed for publish: ${entry}`);
        process.exit(1);
      }
    }
  }
  console.log(`publishConfig OK: ${pkg.name} (private=${pkgJson.private === true})`);
}

const packageCheck = run('npm', ['run', 'package:check'], root, { inherit: true });
if (packageCheck.status !== 0) {
  process.exit(packageCheck.status ?? 1);
}

const sbom = run('npm', ['run', 'sbom'], root, { inherit: true });
if (sbom.status !== 0) {
  process.exit(sbom.status ?? 1);
}

/** @type {{ package: string, mode: string, detail: string }[]} */
const dryRunResults = [];

for (const pkg of packages) {
  const pkgDir = path.join(root, pkg.dir);
  const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  if (pkgJson.private === true) {
    // Expected in Mode A: do not flip private for dry-run; pack fortress already ran.
    dryRunResults.push({
      package: pkg.name,
      mode: 'skipped-private',
      detail: 'private:true — registry dry-run deferred until human flips private for RC'
    });
    console.log(`\n${pkg.name}: npm publish --dry-run skipped (private:true, Mode A expected)`);
    continue;
  }
  const access = publishConfig.access === 'restricted' ? 'restricted' : 'public';
  const dry = run('npm', ['publish', '--dry-run', '--tag', 'rc', '--access', access], pkgDir);
  if (dry.status !== 0) {
    process.stderr.write(dry.stderr || dry.stdout || '');
    process.exit(dry.status ?? 1);
  }
  dryRunResults.push({
    package: pkg.name,
    mode: 'dry-run',
    detail: `npm publish --dry-run --tag rc --access ${access} PASS`
  });
  console.log(`\n${pkg.name}: npm publish --dry-run --tag rc --access ${access} PASS`);
}

const reportPath = path.join(root, 'temp', 'release-check-report.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      publishPerformed: false,
      stableBlockedOnDi10: false,
      di10FullCloseAt: '2026-07-27',
      modeBRequiresHumanAuth: true,
      dryRunResults
    },
    null,
    2
  )}\n`
);

console.log(`\nWrote ${path.relative(root, reportPath)}`);
console.log('release:check PASS (no registry publish)');
