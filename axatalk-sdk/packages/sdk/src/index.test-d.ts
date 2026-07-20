import { describe, expectTypeOf, it } from 'vitest';
import type * as Sdk from './index.js';

describe('@axatalk/sdk type smoke', () => {
  it('exposes no public exports yet', () => {
    expectTypeOf<keyof typeof Sdk>().toEqualTypeOf<never>();
  });
});
