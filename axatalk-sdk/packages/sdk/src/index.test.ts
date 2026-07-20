import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('@axatalk/sdk workspace smoke', () => {
  it('loads the placeholder module without a public surface', async () => {
    const mod: Record<string, unknown> = await import('./index.js');
    expect(Object.keys(mod)).toEqual([]);
  });

  it('depends on the protocol workspace package only', () => {
    const packageJsonPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
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
