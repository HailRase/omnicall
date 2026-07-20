import { describe, expectTypeOf, it } from 'vitest';
import type * as Protocol from './index.js';

describe('@axatalk/protocol type smoke', () => {
  it('exposes no public exports yet', () => {
    expectTypeOf<keyof typeof Protocol>().toEqualTypeOf<never>();
  });
});
