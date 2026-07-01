/**
 * Publish installers from dist-payload/ to axatalk-releases GitHub Release.
 * Uses DISTRIBUTION_GITHUB_TOKEN (PAT with Contents read+write on axatalk-releases).
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DISTRIBUTION_INSTALLER_EXTENSIONS, DISTRIBUTION_REPO } from './distribution-config.mjs';
import {
  createRelease,
  getReleaseByTag,
  uploadReleaseAsset,
  verifyDistributionToken,
} from './github-distribution-api.mjs';

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
  return DISTRIBUTION_INSTALLER_EXTENSIONS.some((ext) => name.endsWith(ext));
}

const files = readdirSync(payloadDir).filter(isInstaller);
if (files.length === 0) {
  console.error(`No installer files in ${payloadDir}`);
  process.exit(1);
}

const title = `Axatalk ${tag}`;
const notes = [
  `Installers for ${tag}.`,
  'Download .exe / .dmg / .AppImage / .deb — not Source code zip.',
].join('\n');

async function main() {
  await verifyDistributionToken(token, DISTRIBUTION_REPO);

  let releaseId;
  const existing = await getReleaseByTag(token, DISTRIBUTION_REPO, tag);
  if (existing !== null) {
    releaseId = existing.id;
    console.log(`Release ${tag} already exists on ${DISTRIBUTION_REPO}, uploading assets`);
  } else {
    releaseId = await createRelease(token, DISTRIBUTION_REPO, { tag, title, notes });
    console.log(`Created release ${tag} on ${DISTRIBUTION_REPO}`);
  }

  for (const file of files) {
    await uploadReleaseAsset(token, DISTRIBUTION_REPO, releaseId, join(payloadDir, file), file);
    console.log(`  uploaded ${file}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
