/**
 * Typed client failures for Promise-returning product commands.
 */

import type { ProtocolErrorCode, WireJsonObject } from '@axata/axatalk-protocol';

/**
 * Typed failure for AxatalkClient commands.
 * Prefer `isAxatalkClientError` + `readInteractionRequiredDetails` /
 * `readConflictErrorDetails` / `readOperationFailedDetails` over raw `details` indexing.
 * @public
 */
export class AxatalkClientError extends Error {
  override readonly name = 'AxatalkClientError';

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
}): AxatalkClientError {
  return new AxatalkClientError(input);
}

/** @public */
export function isAxatalkClientError(value: unknown): value is AxatalkClientError {
  return value instanceof AxatalkClientError;
}
