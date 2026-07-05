/**
 * - Purpose: collect electron-builder installer binaries from a build output tree.
 * - Inputs: source directory (recursive scan), destination directory (flat copy).
 * - Outputs: sorted list of collected file names; exits 1 when none found.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isDistributionInstallerFile } from './distribution-config.mjs';

export function collectInstallerArtifacts(sourceDir, destDir) {
  if (!existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }

  mkdirSync(destDir, { recursive: true });
  const collected = [];

  function walk(directory) {
    for (const entry of readdirSync(directory)) {
      const fullPath = join(directory, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!isDistributionInstallerFile(entry)) {
        continue;
      }

      const destinationPath = join(destDir, entry);
      cpSync(fullPath, destinationPath);
      collected.push(entry);
    }
  }

  walk(sourceDir);
  return collected.sort();
}

function readCliArg(index, envName) {
  const fromEnv = process.env[envName];
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  const fromArgv = process.argv[index];
  if (typeof fromArgv === 'string' && fromArgv.trim().length > 0) {
    return fromArgv.trim();
  }

  return null;
}

function main() {
  const sourceDir = readCliArg(2, 'SOURCE_DIR');
  const destDir = readCliArg(3, 'DEST_DIR') ?? 'dist-payload';

  if (sourceDir === null) {
    console.error(
      'Usage: SOURCE_DIR=dist/win DEST_DIR=release-staging node scripts/collect-installer-artifacts.mjs [source] [dest]',
    );
    process.exit(1);
  }

  const files = collectInstallerArtifacts(sourceDir, destDir);
  if (files.length === 0) {
    console.error(`No installer files found under ${sourceDir}`);
    process.exit(1);
  }

  console.log(`Collected ${files.length} installer(s) into ${destDir}:`);
  for (const fileName of files) {
    console.log(`  - ${fileName}`);
  }
}

const isDirectRun = process.argv[1]?.endsWith('collect-installer-artifacts.mjs') === true;
if (isDirectRun) {
  main();
}
