/**
 * Type-level proof that the CRM example compiles against the public SDK surface.
 */

import { expectTypeOf, test } from 'vitest';

import {
  createOmniCallClient,
  isOmniCallClientError,
  type OmniCallClient,
  type CallMutationResult,
  type LogoutResult,
  type OperatorReason
} from '../index.js';
import {
  SAFE_REQUESTED_CAPABILITIES,
  activateIfGranted,
  loadRevision,
  logoutDemo,
  originateDemoCall,
  waitForReady
} from '../../../../examples/crm-pairing-lite/src/crm-app.js';
import { formatSafeError, toSafeErrorView } from '../../../../examples/crm-pairing-lite/src/safe-error.js';

test('example helpers align with public OmniCallClient', () => {
  expectTypeOf(createOmniCallClient).toBeFunction();
  expectTypeOf(SAFE_REQUESTED_CAPABILITIES).toEqualTypeOf<
    readonly [
      'session.read.redacted',
      'window.show',
      'call.originate',
      'call.control',
      'session.logout',
      'operator.status.write',
      'operator.campaign.read',
      'ocp.acd_context.read'
    ]
  >();
  expectTypeOf(waitForReady).parameter(0).toMatchTypeOf<OmniCallClient>();
  expectTypeOf(loadRevision).returns.toEqualTypeOf<Promise<number>>();
  expectTypeOf(originateDemoCall).returns.resolves.toMatchTypeOf<
    | { readonly ok: true; readonly result: CallMutationResult }
    | { readonly ok: false; readonly safeError: string; readonly code?: string }
  >();
  expectTypeOf(logoutDemo).returns.resolves.toMatchTypeOf<
    | { readonly kind: 'logged_out'; readonly result: LogoutResult }
    | {
        readonly kind: 'interaction_required';
        readonly requiresReason: true;
        readonly reasons: readonly OperatorReason[];
        readonly safeError: string;
      }
    | { readonly kind: 'failed'; readonly safeError: string; readonly code?: string }
  >();
  expectTypeOf(activateIfGranted).returns.toBeObject();
  expectTypeOf(isOmniCallClientError).toBeFunction();
  expectTypeOf(formatSafeError).returns.toEqualTypeOf<string>();
  expectTypeOf(toSafeErrorView).returns.toMatchTypeOf<{
    readonly kind: 'omnicall' | 'unknown';
    readonly message: string;
  }>();
});
