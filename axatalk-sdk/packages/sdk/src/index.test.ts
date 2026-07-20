import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('@axatalk/sdk workspace smoke', () => {
  it('exports read-only AxatalkClient without mutation surface', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.createAuthClient).toBe('function');
    expect(typeof mod.createAxatalkClient).toBe('function');
    expect(mod.CONNECTION_STATES).toContain('ready');
    expect(mod.PUBLIC_EVENT_TYPES).toContain('call:incoming');
    expect(mod.PUBLIC_EVENT_TYPES).not.toContain('CallAnswered');
    expect(mod).not.toHaveProperty('originate');
    expect(mod).not.toHaveProperty('activateProfile');
  });

  it('depends on the protocol workspace package only', () => {
    const packageJsonPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      'package.json'
    );
    const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (
      typeof packageJson !== 'object' ||
      packageJson === null ||
      !('dependencies' in packageJson) ||
      typeof packageJson.dependencies !== 'object' ||
      packageJson.dependencies === null
    ) {
      throw new Error('Invalid package.json');
    }
    expect(packageJson.dependencies).toEqual({ '@axatalk/protocol': '0.0.0' });
  });
});
