/**
 * Typed client failures for Promise-returning product commands.
 */

import type { ProtocolErrorCode, WireJsonObject } from '@softomnitel/omnicall-protocol';

/**
 * Typed failure for OmniCallClient commands.
 * Prefer `isOmniCallClientError` + `readInteractionRequiredDetails` /
 * `readConflictErrorDetails` / `readOperationFailedDetails` over raw `details` indexing.
 * @public
 */
export class OmniCallClientError extends Error {
  override readonly name = 'OmniCallClientError';

  /** Stable protocol / client error code. */
  readonly code: ProtocolErrorCode;

  /** Whether a later retry may succeed without user policy change. */
  readonly retryable: boolean;

  /** Present on many `stale_state` failures — refresh snapshot before retry. */
  readonly currentRevision: number | undefined;

  /**
   * Safe JSON details (never secrets). Shape varies by `code`; use typed readers.
   */
  readonly details: WireJsonObject | undefined;

  constructor(input: {
    readonly code: ProtocolErrorCode;
    readonly retryable: boolean;
    readonly currentRevision?: number;
    readonly details?: WireJsonObject;
  }) {
    super(input.code);
    this.code = input.code;
    this.retryable = input.retryable;
    this.currentRevision = input.currentRevision;
    this.details = input.details;
  }
}

export function createClientError(input: {
  readonly code: ProtocolErrorCode;
  readonly retryable: boolean;
  readonly currentRevision?: number;
  readonly details?: WireJsonObject;
}): OmniCallClientError {
  return new OmniCallClientError(input);
}

/** @public */
export function isOmniCallClientError(value: unknown): value is OmniCallClientError {
  return value instanceof OmniCallClientError;
}
