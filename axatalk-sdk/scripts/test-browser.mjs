#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'vitest.browser.config.ts',
  'tests/browser/harness.browser.test.ts'
];

for (const relativePath of requiredFiles) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Browser harness file missing: ${relativePath}`);
    process.exit(1);
  }
}

console.log('Browser harness scaffold present.');

const runBrowser = process.env.AXATALK_SDK_BROWSER === '1' || process.env.CI === 'true';

if (!runBrowser) {
  console.log(
    'Skipping Playwright browser execution (set AXATALK_SDK_BROWSER=1 after `npx playwright install chromium`).'
  );
  console.log('test:browser PASS (scaffold only)');
  process.exit(0);
}

console.log('Running Vitest browser harness with Playwright Chromium...');
const install = spawnSync('npx', ['playwright', 'install', 'chromium'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: undefined
  }
});
if (install.status !== 0) {
  process.exit(install.status ?? 1);
}

const result = spawnSync('npx', ['vitest', 'run', '--config', 'vitest.browser.config.ts'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('test:browser PASS');
