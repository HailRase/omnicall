/**
 * Format OmniCallClientError for host logs without dumping secret-bearing details.
 */

import { isOmniCallClientError } from '@softomnitel/omnicall-kit';

export type SafeErrorView = {
  readonly kind: 'omnicall' | 'unknown';
  readonly code?: string;
  readonly retryable?: boolean;
  readonly currentRevision?: number;
  readonly message: string;
};

export function toSafeErrorView(error: unknown): SafeErrorView {
  if (isOmniCallClientError(error)) {
    return {
      kind: 'omnicall',
      code: error.code,
      retryable: error.retryable,
      ...(error.currentRevision !== undefined
        ? { currentRevision: error.currentRevision }
        : {}),
      message: `OmniCallClientError:${error.code}`
    };
  }
  if (error instanceof Error) {
    return { kind: 'unknown', message: error.name };
  }
  return { kind: 'unknown', message: 'non_error_throw' };
}

export function formatSafeError(error: unknown): string {
  const view = toSafeErrorView(error);
  if (view.kind === 'omnicall') {
    const revision =
      view.currentRevision !== undefined
        ? ` revision=${String(view.currentRevision)}`
        : '';
    return `${view.message} retryable=${String(view.retryable)}${revision}`;
  }
  return `error:${view.message}`;
}
