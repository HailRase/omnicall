import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  SAFE_REQUESTED_CAPABILITIES,
  activateIfGranted
} from '../../../../examples/crm-pairing-lite/src/crm-app.js';
import { sanitizeRequestedCapabilities } from '../internal/requested-capabilities.js';
import {
  detectDemoWebStorageUsage,
  runCrmPairingLiteDemo
} from './crm-pairing-lite-demo.js';
import { createFakePeerHarness } from './crm-pairing-lite-harness.js';

const sdkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const guideRoot = path.join(sdkRoot, 'docs', 'guide');
const exampleRoot = path.join(sdkRoot, 'examples', 'crm-pairing-lite');

function listFilesRecursive(dir: string, suffix: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listFilesRecursive(full, suffix));
    } else if (full.endsWith(suffix)) {
      out.push(full);
    }
  }
  return out;
}

describe('SDK-09 example smoke (fake peer)', () => {
  it('runs pairing → originate → logout interaction → activate → safe disconnect', async () => {
    const report = await runCrmPairingLiteDemo();
    expect(report.ready).toBe(true);
    expect(report.snapshotRevision).toBe(13);
    expect(report.originateOk).toBe(true);
    expect(report.originateForbiddenCode).toBe('forbidden');
    expect(report.logoutInteraction).toBe(true);
    expect(report.activateOk).toBe(true);
    expect(report.disconnectSensitive).toEqual({
      activate: 0,
      hangup: 0,
      confirmLogout: 0
    });
    expect(report.storageUsesWebStorage).toBe(false);
  });

  it('skips activate when peer did not grant account.activate', async () => {
    const harness = createFakePeerHarness({
      grantedCapabilities: [...SAFE_REQUESTED_CAPABILITIES]
    });
    await harness.reachReady();
    const result = await activateIfGranted(harness.client, 'profile_ref_demo_001');
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('unreachable');
    }
    expect(result.skipped).toBe(true);
    expect(result.code).toBe('forbidden');
    expect(harness.countCommand('account:activate-profile')).toBe(0);
    harness.client.disconnect();
  });

  it('example requested caps stay non-privileged (product sanitize link)', () => {
    const sanitized = sanitizeRequestedCapabilities({
      profile: 'call_controller',
      requested: [
        ...SAFE_REQUESTED_CAPABILITIES,
        'account.activate',
        'window.hide'
      ]
    });
    expect(sanitized).not.toContain('account.activate');
    expect(sanitized).not.toContain('window.hide');
    expect([...SAFE_REQUESTED_CAPABILITIES]).not.toContain('account.activate');
    expect([...SAFE_REQUESTED_CAPABILITIES]).not.toContain('window.hide');
  });

  it('detectDemoWebStorageUsage is false for memory PoP harnesses', async () => {
    const harness = createFakePeerHarness({
      grantedCapabilities: [...SAFE_REQUESTED_CAPABILITIES]
    });
    await harness.reachReady();
    expect(typeof harness.keyStore.peek).toBe('function');
    expect(detectDemoWebStorageUsage([harness])).toBe(false);
    harness.client.disconnect();
  });
});

describe('SDK-09 docs/example secret & privilege scan', () => {
  it('examples never persist to localStorage/sessionStorage or request privileged caps', () => {
    const files = listFilesRecursive(path.join(exampleRoot, 'src'), '.ts');
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text).not.toMatch(/localStorage/);
      expect(text).not.toMatch(/sessionStorage/);
      expect(text).not.toMatch(/sipPassword/);
      expect(text).not.toMatch(/\bapiKey\b/);
      expect(text).not.toMatch(/\bpassword\s*:/);
      expect(text).not.toMatch(
        /requestedCapabilities:\s*\[[^\]]*'account\.activate'/s
      );
      expect(text).not.toMatch(
        /requestedCapabilities:\s*\[[^\]]*'window\.hide'/s
      );
    }
  });

  it('guide quick start does not teach privileged pairing requests', () => {
    const quickStart = readFileSync(
      path.join(guideRoot, 'pairing-quick-start.md'),
      'utf8'
    );
    expect(quickStart).not.toMatch(/account\.activate/);
    expect(quickStart).not.toMatch(/window\.hide/);
    expect(quickStart).not.toMatch(/localStorage/);
    expect(quickStart).not.toMatch(/sessionStorage/);
    expect(quickStart).not.toMatch(/sipPassword/);
    expect(quickStart).not.toMatch(/\bapiKey\s*:/);
  });

  it('guide activate/login pages never show credential property APIs', () => {
    const targets = [
      'saved-profile-activation.md',
      'logout-workflow.md',
      'pairing-quick-start.md',
      'api-reference.md'
    ];
    for (const name of targets) {
      const text = readFileSync(path.join(guideRoot, name), 'utf8');
      expect(text).not.toMatch(/sipPassword/);
      expect(text).not.toMatch(/\bapiKey\s*:/);
      expect(text).not.toMatch(/\bpassword\s*:/);
      expect(text).not.toMatch(/activateProfile\(\s*\{[^}]*password/s);
    }
  });

  it('docs index and security pages exist', () => {
    const required = [
      'README.md',
      'installation.md',
      'pairing-quick-start.md',
      'api-reference.md',
      'events.md',
      'errors.md',
      'capabilities.md',
      'reconnect-multi-tab.md',
      'logout-workflow.md',
      'saved-profile-activation.md',
      'security-anti-patterns.md',
      'upgrade-deprecation.md'
    ];
    for (const name of required) {
      expect(statSync(path.join(guideRoot, name)).isFile()).toBe(true);
    }
  });

  it('api-reference inventory lists exactly the sdk.api.md public exports', () => {
    const apiReport = readFileSync(path.join(sdkRoot, 'etc', 'api', 'sdk.api.md'), 'utf8');
    const reportExports = [
      ...apiReport.matchAll(/^export (?:type|class|function|const) (\w+)/gm)
    ].map((match) => match[1]);
    expect(reportExports).toHaveLength(47);

    const apiReference = readFileSync(path.join(guideRoot, 'api-reference.md'), 'utf8');
    expect(apiReference).toMatch(/\*\*47\*\* symbols/);
    const inventoryBlock = apiReference.match(
      /## Public symbol inventory \(47\)([\s\S]*?)## Factories/
    );
    expect(inventoryBlock).not.toBeNull();
    const inventoryExports = [
      ...(inventoryBlock?.[1] ?? '').matchAll(/`(\w+)`/g)
    ].map((match) => match[1]);
    expect(inventoryExports).toHaveLength(47);
    expect([...inventoryExports].sort()).toEqual([...reportExports].sort());
  });
});
