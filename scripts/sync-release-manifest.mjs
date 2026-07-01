/**
 * Sync F-020 update manifest from package.json version and GitHub Release URL pattern.
 * Preserves minimumSupportedVersion unless --sync-min is passed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const repo = 'HailRase/softphone-electron';
const syncMin = process.argv.includes('--sync-min');

const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const version = pkg.version;
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Invalid package.json version: ${String(version)}`);
  process.exit(1);
}

const tag = `v${version}`;
const downloadBase = `https://github.com/${repo}/releases/download/${tag}`;

function readExistingMin(path) {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    return typeof raw.minimumSupportedVersion === 'string' ? raw.minimumSupportedVersion : version;
  } catch {
    return version;
  }
}

const manifestPaths = [
  join(repoRoot, 'docs/softphone/release/update-manifest.json'),
  join(repoRoot, 'docs/softphone/examples/update-manifest.json'),
];

const minimumSupportedVersion = syncMin
  ? version
  : readExistingMin(manifestPaths[0]);

const manifest = {
  latestVersion: version,
  releaseDate: new Date().toISOString().slice(0, 10),
  releaseNotesUrl: `https://github.com/${repo}/releases/tag/${tag}`,
  downloadUrl: `https://github.com/${repo}/releases/latest`,
  platforms: {
    win32: `${downloadBase}/Axatalk-${version}-win-x64.exe`,
    darwin: `${downloadBase}/Axatalk-${version}-mac-arm64.dmg`,
    linux: `${downloadBase}/Axatalk-${version}-linux-x86_64.AppImage`,
  },
  minimumSupportedVersion,
};

for (const path of manifestPaths) {
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Updated ${path}`);
}
