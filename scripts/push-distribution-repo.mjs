/**
 * Push distribution/README.md and distribution/update-manifest.json to axatalk-releases main.
 * Handles empty repository (initial commit) — required before GitHub Releases API works.
 */

import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DISTRIBUTION_REPO } from './distribution-config.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const isCli =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

function readToken() {
  const raw =
    process.env.DISTRIBUTION_GITHUB_TOKEN ??
    process.env.AXATALK_RELEASES_TOKEN ??
    process.env.GITHUB_TOKEN;
  if (typeof raw !== 'string') {
    return '';
  }
  return raw.trim();
}

function repoHasCommits(cwd) {
  return spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd, encoding: 'utf8' }).status === 0;
}

function cloneDistributionRepo(tmp, token, repo) {
  const url = `https://x-access-token:${token}@github.com/${repo}.git`;

  const shallow = spawnSync('git', ['clone', '--depth', '1', url, tmp], { encoding: 'utf8' });
  if (shallow.status === 0) {
    return;
  }

  const full = spawnSync('git', ['clone', url, tmp], { encoding: 'utf8' });
  if (full.status === 0) {
    return;
  }

  execSync('git init -b main', { cwd: tmp });
  execSync(`git remote add origin ${url}`, { cwd: tmp });
}

/**
 * @param {{ token: string, commitMsg?: string }} options
 */
export function pushDistributionRepo({ token, commitMsg }) {
  const readme = join(repoRoot, 'distribution/README.md');
  const manifest = join(repoRoot, 'distribution/update-manifest.json');

  for (const file of [readme, manifest]) {
    if (!existsSync(file)) {
      throw new Error(`Missing ${file} — run npm run release:sync-manifest first.`);
    }
  }

  const message =
    typeof commitMsg === 'string' && commitMsg.length > 0
      ? commitMsg
      : 'chore: sync distribution manifest and README';

  const tmp = mkdtempSync(join(tmpdir(), 'axatalk-dist-'));

  try {
    cloneDistributionRepo(tmp, token, DISTRIBUTION_REPO);

    if (!repoHasCommits(tmp)) {
      execSync('git checkout -b main', { cwd: tmp, stdio: 'pipe' });
    }

    cpSync(manifest, join(tmp, 'update-manifest.json'));
    cpSync(readme, join(tmp, 'README.md'));

    execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', {
      cwd: tmp,
    });
    execSync('git config user.name "github-actions[bot]"', { cwd: tmp });
    execSync('git add update-manifest.json README.md', { cwd: tmp });

    const status = spawnSync('git', ['status', '--porcelain'], { cwd: tmp, encoding: 'utf8' });
    if (status.stdout.trim().length === 0 && repoHasCommits(tmp)) {
      console.log('No changes to push (already up to date).');
      return;
    }

    execSync(`git commit -m "${message}"`, { cwd: tmp, stdio: 'inherit' });
    execSync('git push -u origin main', { cwd: tmp, stdio: 'inherit' });
    console.log(`Pushed to ${DISTRIBUTION_REPO} main`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const token = readToken();
if (isCli) {
  if (token.length === 0) {
    console.error('DISTRIBUTION_GITHUB_TOKEN or GITHUB_TOKEN is required (write axatalk-releases).');
    process.exit(1);
  }

  try {
    pushDistributionRepo({
      token,
      commitMsg: process.env.DIST_COMMIT_MSG,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}
