/**
 * Typed client failures for Promise-returning product commands.
 */

import type { ProtocolErrorCode } from '@axatalk/protocol';

/**
 * Typed failure for AxatalkClient commands.
 * @public
 */
export class AxatalkClientError extends Error {
  override readonly name = 'AxatalkClientError';
  readonly code: ProtocolErrorCode;
  readonly retryable: boolean;
  readonly currentRevision: number | undefined;

  constructor(input: {
    readonly code: ProtocolErrorCode;
    readonly retryable: boolean;
    readonly currentRevision?: number;
  }) {
    super(input.code);
    this.code = input.code;
    this.retryable = input.retryable;
    this.currentRevision = input.currentRevision;
  }
}

export function createClientError(input: {
  readonly code: ProtocolErrorCode;
  readonly retryable: boolean;
  readonly currentRevision?: number;
}): AxatalkClientError {
  return new AxatalkClientError(input);
}

/** @public */
export function isAxatalkClientError(value: unknown): value is AxatalkClientError {
  return value instanceof AxatalkClientError;
}
