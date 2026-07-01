/**
 * Push distribution/README.md and distribution/update-manifest.json to axatalk-releases main.
 * Requires GITHUB_TOKEN (PAT) with write access to HailRase/axatalk-releases.
 */

import { cpSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { DISTRIBUTION_REPO } from './distribution-config.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const token = process.env.GITHUB_TOKEN;

if (typeof token !== 'string' || token.length === 0) {
  console.error('GITHUB_TOKEN is required (AXATALK_RELEASES_TOKEN in CI).');
  process.exit(1);
}

const readme = join(repoRoot, 'distribution/README.md');
const manifest = join(repoRoot, 'distribution/update-manifest.json');

for (const file of [readme, manifest]) {
  if (!existsSync(file)) {
    console.error(`Missing ${file} — run npm run release:sync-manifest first.`);
    process.exit(1);
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'axatalk-dist-'));
const commitMsg =
  typeof process.env.DIST_COMMIT_MSG === 'string' && process.env.DIST_COMMIT_MSG.length > 0
    ? process.env.DIST_COMMIT_MSG
    : 'chore: sync distribution manifest and README';

try {
  execSync(
    `git clone --depth 1 https://x-access-token:${token}@github.com/${DISTRIBUTION_REPO}.git "${tmp}"`,
    { stdio: 'inherit' },
  );

  cpSync(manifest, join(tmp, 'update-manifest.json'));
  cpSync(readme, join(tmp, 'README.md'));

  execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', {
    cwd: tmp,
  });
  execSync('git config user.name "github-actions[bot]"', { cwd: tmp });
  execSync('git add update-manifest.json README.md', { cwd: tmp });

  try {
    execSync(`git commit -m "${commitMsg}"`, { cwd: tmp, stdio: 'inherit' });
    execSync('git push origin main', { cwd: tmp, stdio: 'inherit' });
    console.log(`Pushed to ${DISTRIBUTION_REPO} main`);
  } catch {
    console.log('No changes to push (already up to date).');
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
