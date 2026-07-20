/**
 * Typed client failures for Promise-returning product commands.
 */

import type { ProtocolErrorCode, WireJsonObject } from '@axatalk/protocol';

/**
 * Typed failure for AxatalkClient commands.
 * Optional `details` carries safe protocol error details (e.g. interaction_required).
 * @public
 */
export class AxatalkClientError extends Error {
  override readonly name = 'AxatalkClientError';
  readonly code: ProtocolErrorCode;
  readonly retryable: boolean;
  readonly currentRevision: number | undefined;
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
