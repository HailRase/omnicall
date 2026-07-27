/**
 * Push distribution payload (README, manifest, changelog, contract) to omnicall-releases main.
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
    process.env.OMNICALL_RELEASES_TOKEN ??
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
const DISTRIBUTION_FILES = [
  { source: 'distribution/README.md', dest: 'README.md' },
  { source: 'distribution/update-manifest.json', dest: 'update-manifest.json' },
  { source: 'distribution/CHANGELOG.md', dest: 'CHANGELOG.md' },
  { source: 'distribution/RELEASE-NOTES-CONTRACT.md', dest: 'RELEASE-NOTES-CONTRACT.md' },
];

export function pushDistributionRepo({ token, commitMsg }) {
  for (const { source } of DISTRIBUTION_FILES) {
    const path = join(repoRoot, source);
    if (!existsSync(path)) {
      throw new Error(`Missing ${path} — run npm run release:sync-manifest first.`);
    }
  }

  const message =
    typeof commitMsg === 'string' && commitMsg.length > 0
      ? commitMsg
      : 'chore: sync distribution manifest and README';

  const tmp = mkdtempSync(join(tmpdir(), 'OmniCall-dist-'));

  try {
    cloneDistributionRepo(tmp, token, DISTRIBUTION_REPO);

    if (!repoHasCommits(tmp)) {
      execSync('git checkout -b main', { cwd: tmp, stdio: 'pipe' });
    }

    for (const { source, dest } of DISTRIBUTION_FILES) {
      cpSync(join(repoRoot, source), join(tmp, dest));
    }

    execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', {
      cwd: tmp,
    });
    execSync('git config user.name "github-actions[bot]"', { cwd: tmp });
    execSync(
      `git add ${DISTRIBUTION_FILES.map((f) => f.dest).join(' ')}`,
      { cwd: tmp },
    );

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
    console.error('DISTRIBUTION_GITHUB_TOKEN or GITHUB_TOKEN is required (write omnicall-releases).');
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
