/**
 * Publish installers from dist-payload/ to omnicall-releases GitHub Release.
 * Uses DISTRIBUTION_GITHUB_TOKEN (PAT with Contents read+write on omnicall-releases).
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { isDistributionInstallerFile, DISTRIBUTION_REPO } from './distribution-config.mjs';
import { generateDistributionReleaseNotes } from './generate-distribution-release-notes.mjs';
import {
  ensureReleaseId,
  uploadReleaseAsset,
  verifyDistributionToken,
} from './github-distribution-api.mjs';

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

const token = readToken();
if (token.length === 0) {
  console.error('DISTRIBUTION_GITHUB_TOKEN is required.');
  process.exit(1);
}

const tag = process.env.RELEASE_TAG ?? process.argv[2];
const payloadDir = process.env.PAYLOAD_DIR ?? process.argv[3] ?? 'dist-payload';

if (typeof tag !== 'string' || !/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.error('RELEASE_TAG must be set (e.g. v0.0.2).');
  process.exit(1);
}

function isInstaller(name) {
  return isDistributionInstallerFile(name);
}

const files = readdirSync(payloadDir).filter(isInstaller);
if (files.length === 0) {
  console.error(`No installer files in ${payloadDir}`);
  process.exit(1);
}

const title = `OmniCall ${tag}`;
const notes = generateDistributionReleaseNotes(tag);

async function main() {
  await verifyDistributionToken(token, DISTRIBUTION_REPO);

  const releaseId = await ensureReleaseId(token, DISTRIBUTION_REPO, { tag, title, notes });
  console.log(`Using release ${tag} on ${DISTRIBUTION_REPO} (id ${releaseId})`);

  for (const file of files) {
    try {
      await uploadReleaseAsset(token, DISTRIBUTION_REPO, releaseId, join(payloadDir, file), file);
      console.log(`  uploaded ${file}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('HTTP 422') && message.toLowerCase().includes('already exists')) {
        console.log(`  skip ${file} (asset already on release)`);
        continue;
      }
      throw error;
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
