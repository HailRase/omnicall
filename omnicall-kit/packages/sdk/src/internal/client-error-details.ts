/**
 * Typed readers for common OmniCallClientError.details shapes.
 * Raw `details` stays WireJsonObject for forward compatibility; hosts should use
 * these helpers instead of indexing unknown keys.
 */

import type { WireJsonObject } from '@softomnitel/omnicall-protocol';

import {
  isOmniCallClientError,
  type OmniCallClientError
} from './client-errors.js';
import type { OperatorReason } from './operator-commands.js';

/**
 * Logout / human-step details for `interaction_required`.
 * @public
 */
export type InteractionRequiredDetails = {
  readonly requiresReason: true;
  readonly reasons: readonly OperatorReason[];
};

/**
 * Common `conflict` detail keys (activate pending, finish-appeal gate, hide busy).
 * @public
 */
export type ConflictErrorDetails = {
  readonly failure_kind?: string;
  readonly activate_consent_pending?: boolean;
};

/**
 * Common `operation_failed` detail keys (e.g. originate preflight).
 * @public
 */
export type OperationFailedDetails = {
  readonly failure_kind?: string;
};

function asRecord(
  details: WireJsonObject | undefined
): Readonly<Record<string, unknown>> | undefined {
  if (details === undefined) {
    return undefined;
  }
  return details;
}

/**
 * Parse logout-style `interaction_required` details.
 * Returns `undefined` when shape is absent or malformed (fail closed for hosts).
 * @public
 */
export function readInteractionRequiredDetails(
  details: WireJsonObject | undefined
): InteractionRequiredDetails | undefined {
  const record = asRecord(details);
  if (record === undefined || record['requiresReason'] !== true) {
    return undefined;
  }
  const raw = record['reasons'];
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const reasons: OperatorReason[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      return undefined;
    }
    const row = item as Readonly<Record<string, unknown>>;
    const id = row['id'];
    const label = row['label'];
    const kind = row['kind'];
    if (
      typeof id !== 'number' ||
      !Number.isInteger(id) ||
      id < 0 ||
      typeof label !== 'string' ||
      label.length === 0 ||
      (kind !== 'ready' && kind !== 'break' && kind !== 'logout')
    ) {
      return undefined;
    }
    reasons.push({ id, label, kind });
  }
  return { requiresReason: true, reasons };
}

/**
 * Best-effort typed view of `conflict` details (additive keys only).
 * @public
 */
export function readConflictErrorDetails(
  details: WireJsonObject | undefined
): ConflictErrorDetails | undefined {
  const record = asRecord(details);
  if (record === undefined) {
    return undefined;
  }
  const failureKind = record['failure_kind'];
  const pending = record['activate_consent_pending'];
  const out: {
    failure_kind?: string;
    activate_consent_pending?: boolean;
  } = {};
  if (typeof failureKind === 'string' && failureKind.length > 0) {
    out.failure_kind = failureKind;
  }
  if (typeof pending === 'boolean') {
    out.activate_consent_pending = pending;
  }
  if (out.failure_kind === undefined && out.activate_consent_pending === undefined) {
    return undefined;
  }
  return out;
}

/**
 * Best-effort typed view of `operation_failed` details.
 * @public
 */
export function readOperationFailedDetails(
  details: WireJsonObject | undefined
): OperationFailedDetails | undefined {
  const record = asRecord(details);
  if (record === undefined) {
    return undefined;
  }
  const failureKind = record['failure_kind'];
  if (typeof failureKind !== 'string' || failureKind.length === 0) {
    return undefined;
  }
  return { failure_kind: failureKind };
}

/** @public */
export function isInteractionRequiredError(
  error: unknown
): error is OmniCallClientError & { readonly code: 'interaction_required' } {
  return isOmniCallClientError(error) && error.code === 'interaction_required';
}

/** @public */
export function isConflictError(
  error: unknown
): error is OmniCallClientError & { readonly code: 'conflict' } {
  return isOmniCallClientError(error) && error.code === 'conflict';
}

/** @public */
export function isOperationFailedError(
  error: unknown
): error is OmniCallClientError & { readonly code: 'operation_failed' } {
  return isOmniCallClientError(error) && error.code === 'operation_failed';
}
