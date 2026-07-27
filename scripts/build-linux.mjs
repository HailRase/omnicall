/**
 * Linux packaging entry point with Windows symlink preflight.
 * AppImage requires file symlinks; Windows allows them only with Developer Mode or elevated shell.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function canCreateFileSymlink() {
  const probeDir = join(tmpdir(), 'OmniCall-symlink-probe');
  const linkPath = join(probeDir, 'probe-link');
  const targetPath = join(probeDir, 'probe-target');

  try {
    mkdirSync(probeDir, { recursive: true });
    mkdirSync(targetPath, { recursive: true });
    if (existsSync(linkPath)) {
      rmSync(linkPath, { recursive: true, force: true });
    }
    symlinkSync(targetPath, linkPath, 'file');
    rmSync(linkPath, { recursive: true, force: true });
    rmSync(targetPath, { recursive: true, force: true });
    rmSync(probeDir, { recursive: true, force: true });
    return true;
  } catch {
    try {
      if (existsSync(linkPath)) rmSync(linkPath, { recursive: true, force: true });
      if (existsSync(targetPath)) rmSync(targetPath, { recursive: true, force: true });
      if (existsSync(probeDir)) rmSync(probeDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
    return false;
  }
}

function printWindowsSymlinkHelp() {
  console.error(
    [
      '',
      'Linux AppImage на Windows требует создания symlink (символических ссылок).',
      'Сейчас Windows их блокирует (EPERM) — из-за этого падает сборка AppImage.',
      '',
      'Варианты:',
      '  1. Включить режим разработчика: Параметры → Конфиденциальность и защита → Для разработчиков → Режим разработчика',
      '     (или выполните: start ms-settings:developers)',
      '  2. Запустить PowerShell/Cursor от имени администратора и повторить npm run build:linux',
      '  3. Собрать на Linux / GitHub Actions (.github/workflows/release.yml, ubuntu-latest)',
      '',
      'Без symlink на Windows недоступны AppImage и .deb (нужны Linux и fpm).',
      'Распакованный linux-unpacked можно получить только после включения symlink или на Linux.',
      '',
    ].join('\n'),
  );
}

function runElectronBuilder(extraArgs = []) {
  const result = spawnSync(
    'node',
    ['scripts/run-electron-builder.mjs', '--linux', '-c.directories.output=dist/linux', ...extraArgs],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );

  process.exit(result.status ?? 1);
}

if (process.platform === 'win32' && !canCreateFileSymlink()) {
  printWindowsSymlinkHelp();
  process.exit(1);
}

runElectronBuilder();
