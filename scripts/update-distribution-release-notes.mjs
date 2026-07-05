/**
 * Set or refresh the GitHub Release body on axatalk-releases from distribution/CHANGELOG.md.
 */

import {
  generateDistributionReleaseNotes,
  versionFromTag,
  parsePublicChangelogEntry,
} from './generate-distribution-release-notes.mjs';
import {
  getReleaseByTag,
  updateRelease,
  verifyDistributionToken,
} from './github-distribution-api.mjs';
import { DISTRIBUTION_REPO } from './distribution-config.mjs';

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

const token = readToken();
const tag = process.env.RELEASE_TAG ?? process.argv[2];

if (token.length === 0) {
  console.error('DISTRIBUTION_GITHUB_TOKEN is required.');
  process.exit(1);
}

if (typeof tag !== 'string' || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.error('RELEASE_TAG must be set (e.g. v0.1.3).');
  process.exit(1);
}

const title = `Axatalk ${tag}`;
const notes = generateDistributionReleaseNotes(tag);
const version = versionFromTag(tag);
const hasEntry = parsePublicChangelogEntry(version) !== null;

async function main() {
  await verifyDistributionToken(token, DISTRIBUTION_REPO);

  const release = await getReleaseByTag(token, DISTRIBUTION_REPO, tag);
  if (release === null) {
    console.error(`Release ${tag} not found on ${DISTRIBUTION_REPO}. Upload installers first.`);
    process.exit(1);
  }

  await updateRelease(token, DISTRIBUTION_REPO, release.id, { title, notes });
  console.log(`Updated release body for ${tag} on ${DISTRIBUTION_REPO}`);
  if (!hasEntry) {
    console.log('  (no CHANGELOG entry — fallback body applied)');
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
