/**
 * Backfill GitHub Release bodies on axatalk-releases from distribution/CHANGELOG.md.
 * Does not invent history — uses changelog entries or a neutral fallback per version.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateDistributionReleaseNotes,
  versionFromTag,
  parsePublicChangelogEntry,
} from './generate-distribution-release-notes.mjs';
import {
  listReleases,
  getReleaseByTag,
  updateRelease,
  verifyDistributionToken,
} from './github-distribution-api.mjs';
import { DISTRIBUTION_REPO } from './distribution-config.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_CHANGELOG = join(repoRoot, 'distribution/CHANGELOG.md');

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

function parseChangelogVersions() {
  if (!existsSync(PUBLIC_CHANGELOG)) {
    return [];
  }
  const text = readFileSync(PUBLIC_CHANGELOG, 'utf8');
  const versions = [];
  const pattern = /^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}\s*$/gm;
  let match = pattern.exec(text);
  while (match !== null) {
    versions.push(match[1]);
    match = pattern.exec(text);
  }
  return versions;
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const tagFilter = args.find((arg) => /^v\d+\.\d+\.\d+$/.test(arg));

const token = readToken();
if (!dryRun && token.length === 0) {
  console.error('DISTRIBUTION_GITHUB_TOKEN is required (or use --dry-run).');
  process.exit(1);
}

async function backfillTag(tag) {
  const notes = generateDistributionReleaseNotes(tag);
  const version = versionFromTag(tag);
  const hasEntry = parsePublicChangelogEntry(version) !== null;
  const title = `Axatalk ${tag}`;

  if (dryRun) {
    console.log(`\n--- ${tag} ${hasEntry ? '(changelog)' : '(fallback)'} ---`);
    console.log(notes);
    return;
  }

  const release = await getReleaseByTag(token, DISTRIBUTION_REPO, tag);
  if (release === null) {
    console.log(`skip ${tag} — release not found`);
    return;
  }

  await updateRelease(token, DISTRIBUTION_REPO, release.id, { title, notes });
  console.log(`updated ${tag}${hasEntry ? '' : ' (fallback body)'}`);
}

async function main() {
  if (!dryRun) {
    await verifyDistributionToken(token, DISTRIBUTION_REPO);
  }

  if (tagFilter !== undefined) {
    await backfillTag(tagFilter);
    return;
  }

  const changelogVersions = parseChangelogVersions();
  const remoteTags = dryRun
    ? changelogVersions.map((v) => `v${v}`)
    : (await listReleases(token, DISTRIBUTION_REPO)).map((r) => r.tag);

  const tags = [...new Set(remoteTags)].sort((a, b) => compareTags(b, a));

  for (const tag of tags) {
    await backfillTag(tag);
  }
}

function compareTags(a, b) {
  const pa = versionFromTag(a).split('.').map(Number);
  const pb = versionFromTag(b).split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
