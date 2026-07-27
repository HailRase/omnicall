import { describe, expect, it } from 'vitest';

import { OmniCallClientError } from './client-errors.js';
import {
  isConflictError,
  isInteractionRequiredError,
  isOperationFailedError,
  readConflictErrorDetails,
  readInteractionRequiredDetails,
  readOperationFailedDetails
} from './client-error-details.js';

describe('client-error-details', () => {
  it('reads interaction_required logout reasons', () => {
    const details = readInteractionRequiredDetails({
      requiresReason: true,
      reasons: [{ id: 1, label: 'End of shift', kind: 'logout' }]
    });
    expect(details).toEqual({
      requiresReason: true,
      reasons: [{ id: 1, label: 'End of shift', kind: 'logout' }]
    });
  });

  it('rejects malformed interaction_required details', () => {
    expect(readInteractionRequiredDetails({ requiresReason: true })).toBeUndefined();
    expect(
      readInteractionRequiredDetails({
        requiresReason: true,
        reasons: [{ id: 1, label: 'x', kind: 'nope' }]
      })
    ).toBeUndefined();
  });

  it('reads conflict and operation_failed failure_kind', () => {
    expect(
      readConflictErrorDetails({
        failure_kind: 'not_in_post_call_processing',
        activate_consent_pending: true
      })
    ).toEqual({
      failure_kind: 'not_in_post_call_processing',
      activate_consent_pending: true
    });
    expect(
      readOperationFailedDetails({ failure_kind: 'sip_not_registered' })
    ).toEqual({ failure_kind: 'sip_not_registered' });
  });

  it('narrows error codes with typed guards', () => {
    const interaction = new OmniCallClientError({
      code: 'interaction_required',
      retryable: false,
      details: { requiresReason: true, reasons: [] }
    });
    const conflict = new OmniCallClientError({
      code: 'conflict',
      retryable: true,
      details: { failure_kind: 'not_in_post_call_processing' }
    });
    const failed = new OmniCallClientError({
      code: 'operation_failed',
      retryable: false,
      details: { failure_kind: 'sip_not_registered' }
    });
    expect(isInteractionRequiredError(interaction)).toBe(true);
    expect(isConflictError(conflict)).toBe(true);
    expect(isOperationFailedError(failed)).toBe(true);
    expect(isInteractionRequiredError(conflict)).toBe(false);
  });
});
