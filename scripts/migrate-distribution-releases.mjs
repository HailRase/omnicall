/**
 * One-time / manual: copy GitHub Releases (installers only) from source repo to axatalk-releases.
 *
 * Tokens (separate):
 *   SOURCE_GITHUB_TOKEN       — read releases on HailRase/softphone-electron
 *   DISTRIBUTION_GITHUB_TOKEN — write releases + main on HailRase/axatalk-releases
 *
 * CI: SOURCE=github.token, DISTRIBUTION=secrets.AXATALK_RELEASES_TOKEN
 * Local: SOURCE=classic PAT with repo read; DISTRIBUTION=PAT write axatalk-releases
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

const sourceToken = process.env.SOURCE_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
const distributionToken =
  process.env.DISTRIBUTION_GITHUB_TOKEN ?? process.env.AXATALK_RELEASES_TOKEN;

if (typeof sourceToken !== 'string' || sourceToken.length === 0) {
  console.error('SOURCE_GITHUB_TOKEN is required (read access to softphone-electron).');
  process.exit(1);
}

if (typeof distributionToken !== 'string' || distributionToken.length === 0) {
  console.error('DISTRIBUTION_GITHUB_TOKEN is required (write access to axatalk-releases).');
  process.exit(1);
}

const tags = process.argv.slice(2).filter((arg) => /^v\d+\.\d+\.\d+$/.test(arg));
if (tags.length === 0) {
  console.error(
    'Usage: SOURCE_GITHUB_TOKEN=... DISTRIBUTION_GITHUB_TOKEN=... node scripts/migrate-distribution-releases.mjs v0.0.1 [v0.0.2 ...]',
  );
  process.exit(1);
}

function gh(args, token) {
  const env = { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token };
  const result = spawnSync('gh', args, { env, encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

function ghOptional(args, token) {
  const env = { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token };
  return spawnSync('gh', args, { env, encoding: 'utf8', shell: process.platform === 'win32' });
}

function isInstallerFile(name) {
  return DISTRIBUTION_INSTALLER_EXTENSIONS.some((ext) => name.endsWith(ext));
}

for (const tag of tags) {
  console.log(`\n=== Migrating ${tag} ===`);

  const existing = ghOptional(
    ['release', 'view', tag, '-R', DISTRIBUTION_REPO],
    distributionToken,
  );
  if (existing.status === 0) {
    console.log(`Skip ${tag}: already exists on ${DISTRIBUTION_REPO}`);
    continue;
  }

  const workDir = join(tmpdir(), `axatalk-migrate-${tag}`);
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  console.log(`Downloading assets from ${SOURCE_REPO}...`);
  gh(['release', 'download', tag, '-R', SOURCE_REPO, '-D', workDir], sourceToken);

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

  gh(
    [
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
    ],
    distributionToken,
  );

  console.log(`Created ${DISTRIBUTION_REPO} release ${tag}`);
  rmSync(workDir, { recursive: true, force: true });
}

console.log('\nSyncing manifest and README to distribution repo...');
execSync('node scripts/sync-release-manifest.mjs', { cwd: repoRoot, stdio: 'inherit' });
execSync('node scripts/push-distribution-repo.mjs', {
  cwd: repoRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    GITHUB_TOKEN: distributionToken,
    DISTRIBUTION_GITHUB_TOKEN: distributionToken,
    DIST_COMMIT_MSG: `chore: manifest after migrating ${tags.join(', ')}`,
  },
});

console.log('\nDone. Verify:', `https://github.com/${DISTRIBUTION_REPO}/releases`);
