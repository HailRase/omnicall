import { describe, expect, it } from 'vitest';

import {
  createOriginBlockedError,
  createOriginDeniedError,
  isOriginBlockedError,
  isOriginPolicyTransportReject,
  mapTransportCloseToOriginPolicyError
} from './origin-policy-errors.js';

describe('origin policy client errors', () => {
  it('marks origin_blocked as non-retryable', () => {
    const error = createOriginBlockedError();
    expect(error.code).toBe('origin_blocked');
    expect(error.retryable).toBe(false);
    expect(isOriginBlockedError(error)).toBe(true);
  });

  it('treats wire origin_denied forbidden as terminal origin policy', () => {
    const error = createOriginDeniedError();
    expect(error.code).toBe('forbidden');
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ origin_denied: true });
    expect(isOriginBlockedError(error)).toBe(true);
  });

  it('maps blacklist upgrade reject before handshake to origin_blocked', () => {
    expect(
      isOriginPolicyTransportReject({ code: 1006, reason: 'origin_denied' })
    ).toBe(true);
    const mapped = mapTransportCloseToOriginPolicyError(
      { code: 1006, reason: 'origin_denied' },
      'connecting'
    );
    expect(mapped?.code).toBe('origin_blocked');
    expect(mapped?.retryable).toBe(false);
  });

  it('maps post-handshake origin_denied close to forbidden details', () => {
    const mapped = mapTransportCloseToOriginPolicyError(
      { code: 1000, reason: 'origin_denied' },
      'handshaking'
    );
    expect(mapped?.code).toBe('forbidden');
    expect(isOriginBlockedError(mapped)).toBe(true);
  });
});
