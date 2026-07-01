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
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  DISTRIBUTION_INSTALLER_EXTENSIONS,
  DISTRIBUTION_REPO,
  SOURCE_REPO,
} from './distribution-config.mjs';
import {
  createRelease,
  getReleaseByTag,
  uploadReleaseAsset,
  verifyDistributionToken,
} from './github-distribution-api.mjs';
import { pushDistributionRepo } from './push-distribution-repo.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function readToken(name, fallbackName) {
  const raw = process.env[name] ?? process.env[fallbackName];
  if (typeof raw !== 'string') {
    return '';
  }
  return raw.trim();
}

const sourceToken = readToken('SOURCE_GITHUB_TOKEN', 'GITHUB_TOKEN');
const distributionToken = readToken('DISTRIBUTION_GITHUB_TOKEN', 'AXATALK_RELEASES_TOKEN');

if (sourceToken.length === 0) {
  console.error('SOURCE_GITHUB_TOKEN is required (read access to softphone-electron).');
  process.exit(1);
}

if (distributionToken.length === 0) {
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

function ghDownload(args, token) {
  const env = { ...process.env };
  delete env.GITHUB_TOKEN;
  env.GH_TOKEN = token;
  const result = spawnSync('gh', args, { env, encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    const output = `${result.stderr ?? ''}${result.stdout ?? ''}`;
    if (output.includes('release not found')) {
      console.error(
        `No GitHub Release for ${args[2] ?? 'tag'} on ${SOURCE_REPO} (tag alone is not enough).`,
      );
      console.error(
        'Fix: re-push tag to trigger Release workflow, or publish installers on source first.',
      );
      console.error(`  git push origin :refs/tags/${args[2]} && git push origin ${args[2]}`);
    } else {
      console.error(output);
    }
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

function isInstallerFile(name) {
  return DISTRIBUTION_INSTALLER_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function syncDistributionManifest(commitMsg) {
  execSync('node scripts/sync-release-manifest.mjs', { cwd: repoRoot, stdio: 'inherit' });
  pushDistributionRepo({ token: distributionToken, commitMsg });
}

async function main() {
  console.log(`Verifying distribution token for ${DISTRIBUTION_REPO}...`);
  await verifyDistributionToken(distributionToken, DISTRIBUTION_REPO);

  console.log('\nInitializing distribution repo (README + manifest on main)...');
  syncDistributionManifest('chore: initial distribution manifest and README');

  for (const tag of tags) {
    console.log(`\n=== Migrating ${tag} ===`);

    const existing = await getReleaseByTag(distributionToken, DISTRIBUTION_REPO, tag);
    if (existing !== null) {
      console.log(`Skip ${tag}: already exists on ${DISTRIBUTION_REPO}`);
      continue;
    }

    const workDir = join(tmpdir(), `axatalk-migrate-${tag}`);
    rmSync(workDir, { recursive: true, force: true });
    mkdirSync(workDir, { recursive: true });

    console.log(`Downloading assets from ${SOURCE_REPO}...`);
    ghDownload(['release', 'download', tag, '-R', SOURCE_REPO, '-D', workDir], sourceToken);

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
    const releaseId = await createRelease(distributionToken, DISTRIBUTION_REPO, {
      tag,
      title,
      notes: `Migrated from ${SOURCE_REPO}. Installers only.`,
    });

    for (const file of installers) {
      await uploadReleaseAsset(
        distributionToken,
        DISTRIBUTION_REPO,
        releaseId,
        join(payloadDir, file),
        file,
      );
      console.log(`  uploaded ${file}`);
    }

    console.log(`Created ${DISTRIBUTION_REPO} release ${tag}`);
    rmSync(workDir, { recursive: true, force: true });
  }

  console.log('\nSyncing manifest after migration...');
  syncDistributionManifest(`chore: manifest after migrating ${tags.join(', ')}`);

  console.log('\nDone. Verify:', `https://github.com/${DISTRIBUTION_REPO}/releases`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
