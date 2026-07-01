/**
 * Sync F-020 update manifest from package.json → distribution repo URL pattern.
 * Writes dev copies + distribution/ payload for axatalk-releases.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DISTRIBUTION_REPO,
  DISTRIBUTION_MANIFEST_RAW_URL,
} from './distribution-config.mjs';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const syncMin = process.argv.includes('--sync-min');

const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const version = pkg.version;
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid package.json version: ${String(version)}`);
  process.exit(1);
}

const tag = `v${version}`;
const downloadBase = `https://github.com/${DISTRIBUTION_REPO}/releases/download/${tag}`;

function readExistingMin(path) {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    return typeof raw.minimumSupportedVersion === 'string' ? raw.minimumSupportedVersion : version;
  } catch {
    return version;
  }
}

const devManifestPath = join(repoRoot, 'docs/softphone/release/update-manifest.json');
const minimumSupportedVersion = syncMin ? version : readExistingMin(devManifestPath);

const manifest = {
  latestVersion: version,
  releaseDate: new Date().toISOString().slice(0, 10),
  releaseNotesUrl: `https://github.com/${DISTRIBUTION_REPO}/releases/tag/${tag}`,
  downloadUrl: `https://github.com/${DISTRIBUTION_REPO}/releases/latest`,
  platforms: {
    win32: `${downloadBase}/Axatalk-${version}-win-x64.exe`,
    darwin: `${downloadBase}/Axatalk-${version}-mac-arm64.dmg`,
    linux: `${downloadBase}/Axatalk-${version}-linux-x86_64.AppImage`,
  },
  minimumSupportedVersion,
};

const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;

const outputPaths = [
  devManifestPath,
  join(repoRoot, 'docs/softphone/examples/update-manifest.json'),
  join(repoRoot, 'distribution/update-manifest.json'),
];

for (const path of outputPaths) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, manifestJson, 'utf8');
  console.log(`Updated ${path}`);
}

console.log(`Manifest raw URL (production): ${DISTRIBUTION_MANIFEST_RAW_URL}`);
