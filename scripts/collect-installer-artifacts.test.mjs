import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { collectInstallerArtifacts } from './collect-installer-artifacts.mjs';

describe('collectInstallerArtifacts', () => {
  it('collects only distribution installer files from nested build output', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'OmniCall-collect-'));
    const sourceDir = join(tempRoot, 'dist', 'win');
    const nestedDir = join(sourceDir, 'win-unpacked');
    const destDir = join(tempRoot, 'staging');

    mkdirSync(nestedDir, { recursive: true });
    writeFileSync(join(sourceDir, 'OmniCall-0.1.0-win-x64.exe'), 'exe');
    writeFileSync(join(sourceDir, 'OmniCall-0.1.0-win-x64.msi'), 'msi');
    writeFileSync(join(sourceDir, 'OmniCall-0.1.0-win-x64.exe.blockmap'), 'map');
    writeFileSync(join(nestedDir, 'OmniCall.exe'), 'unpacked');

    const collected = collectInstallerArtifacts(sourceDir, destDir);

    expect(collected).toEqual(['OmniCall-0.1.0-win-x64.exe', 'OmniCall-0.1.0-win-x64.msi']);

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('throws when source directory is missing', () => {
    expect(() => collectInstallerArtifacts('/missing/path', '/tmp/out')).toThrow(
      'Source directory not found',
    );
  });
});
