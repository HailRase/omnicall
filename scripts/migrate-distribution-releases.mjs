/**
 * One-time / manual: copy GitHub Releases (installers only) from source repo to axatalk-releases.
 * Usage: GITHUB_TOKEN=... node scripts/migrate-distribution-releases.mjs v0.0.1 v0.0.2
 */

import { execSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  DISTRIBUTION_INSTALLER_EXTENSIONS,
  DISTRIBUTION_REPO,
  SOURCE_REPO,
} from './distribution-config.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const token = process.env.GITHUB_TOKEN;

if (typeof token !== 'string' || token.length === 0) {
  console.error('GITHUB_TOKEN is required (PAT with read source + write distribution).');
  process.exit(1);
}

const tags = process.argv.slice(2).filter((arg) => /^v\d+\.\d+\.\d+$/.test(arg));
if (tags.length === 0) {
  console.error('Usage: GITHUB_TOKEN=... node scripts/migrate-distribution-releases.mjs v0.0.1 [v0.0.2 ...]');
  process.exit(1);
}

const env = { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token };

function gh(args) {
  const result = spawnSync('gh', args, { env, encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

function isInstallerFile(name) {
  return DISTRIBUTION_INSTALLER_EXTENSIONS.some((ext) => name.endsWith(ext));
}

for (const tag of tags) {
  console.log(`\n=== Migrating ${tag} ===`);

  const existing = spawnSync(
    'gh',
    ['release', 'view', tag, '-R', DISTRIBUTION_REPO],
    { env, encoding: 'utf8', shell: process.platform === 'win32' },
  );
  if (existing.status === 0) {
    console.log(`Skip ${tag}: already exists on ${DISTRIBUTION_REPO}`);
    continue;
  }

  const workDir = join(tmpdir(), `axatalk-migrate-${tag}`);
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  console.log(`Downloading assets from ${SOURCE_REPO}...`);
  gh(['release', 'download', tag, '-R', SOURCE_REPO, '-D', workDir]);

  const installers = readdirSync(workDir).filter(isInstallerFile);
  if (installers.length === 0) {
    console.error(`No installer files in ${SOURCE_REPO} release ${tag}`);
    process.exit(1);
  }

  const payloadDir = join(workDir, 'payload');
  mkdirSync(payloadDir, { recursive: true });
  for (const file of installers) {
    copyFileSync(join(workDir, file), join(payloadDir, file));
    console.log(`  + ${file}`);
  }

  const title = `Axatalk ${tag}`;
  const fileArgs = installers.flatMap((f) => ['--attach', join(payloadDir, f)]);

  gh([
    'release',
    'create',
    tag,
    '-R',
    DISTRIBUTION_REPO,
    '--title',
    title,
    '--notes',
    `Migrated from ${SOURCE_REPO}. Installers only.`,
    ...fileArgs,
  ]);

  console.log(`Created ${DISTRIBUTION_REPO} release ${tag}`);
  rmSync(workDir, { recursive: true, force: true });
}

console.log('\nSyncing manifest and README to distribution repo...');
execSync('node scripts/sync-release-manifest.mjs', { cwd: repoRoot, stdio: 'inherit', env });
execSync('node scripts/push-distribution-repo.mjs', {
  cwd: repoRoot,
  stdio: 'inherit',
  env: { ...env, DIST_COMMIT_MSG: `chore: manifest after migrating ${tags.join(', ')}` },
});

console.log('\nDone. Verify:', `https://github.com/${DISTRIBUTION_REPO}/releases`);
