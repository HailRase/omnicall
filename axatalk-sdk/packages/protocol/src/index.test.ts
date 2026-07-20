import { describe, expect, it } from 'vitest';

describe('@axatalk/protocol workspace smoke', () => {
  it('loads the placeholder module without a public surface', async () => {
    const mod: Record<string, unknown> = await import('./index.js');
    expect(Object.keys(mod)).toEqual([]);
  });
});
