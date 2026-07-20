/**
 * Type-level proof that the CRM example compiles against the public SDK surface.
 */

import { expectTypeOf, test } from 'vitest';

import {
  createAxatalkClient,
  isAxatalkClientError,
  type AxatalkClient,
  type CallMutationResult,
  type PrepareLogoutResult
} from '../index.js';
import {
  SAFE_REQUESTED_CAPABILITIES,
  activateIfGranted,
  loadRevision,
  originateDemoCall,
  prepareLogoutDemo,
  waitForReady
} from '../../../../examples/crm-pairing-lite/src/crm-app.js';
import { formatSafeError, toSafeErrorView } from '../../../../examples/crm-pairing-lite/src/safe-error.js';

test('example helpers align with public AxatalkClient', () => {
  expectTypeOf(createAxatalkClient).toBeFunction();
  expectTypeOf(SAFE_REQUESTED_CAPABILITIES).toEqualTypeOf<
    readonly [
      'session.read.redacted',
      'window.show',
      'call.originate',
      'call.control',
      'session.logout',
      'operator.status.write'
    ]
  >();
  expectTypeOf(waitForReady).parameter(0).toMatchTypeOf<AxatalkClient>();
  expectTypeOf(loadRevision).returns.toEqualTypeOf<Promise<number>>();
  expectTypeOf(originateDemoCall).returns.resolves.toMatchTypeOf<
    | { readonly ok: true; readonly result: CallMutationResult }
    | { readonly ok: false; readonly safeError: string; readonly code?: string }
  >();
  expectTypeOf(prepareLogoutDemo).returns.resolves.toMatchTypeOf<
    | { readonly kind: 'prepared'; readonly result: PrepareLogoutResult }
    | {
        readonly kind: 'interaction_required';
        readonly logoutToken: string;
        readonly safeError: string;
      }
    | { readonly kind: 'failed'; readonly safeError: string; readonly code?: string }
  >();
  expectTypeOf(activateIfGranted).returns.toBeObject();
  expectTypeOf(isAxatalkClientError).toBeFunction();
  expectTypeOf(formatSafeError).returns.toEqualTypeOf<string>();
  expectTypeOf(toSafeErrorView).returns.toMatchTypeOf<{
    readonly kind: 'axatalk' | 'unknown';
    readonly message: string;
  }>();
});
