/**
 * Parse product inbound frames (snapshot / public events) from unknown.
 */

import {
  EventMessageSchema,
  SnapshotMessageSchema,
  validateWithSchema,
  type EventMessage,
  type SnapshotMessage
} from '@softomnitel/omnicall-protocol';

export type ProductInbound =
  | { readonly kind: 'snapshot'; readonly message: SnapshotMessage }
  | { readonly kind: 'event'; readonly message: EventMessage }
  | { readonly kind: 'ignored' };

export function parseProductInbound(raw: string): ProductInbound {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { kind: 'ignored' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { kind: 'ignored' };
  }
  const kind = 'kind' in parsed ? parsed.kind : undefined;
  if (kind === 'snapshot') {
    const result = validateWithSchema(SnapshotMessageSchema, parsed);
    return result.success
      ? { kind: 'snapshot', message: result.data }
      : { kind: 'ignored' };
  }
  if (kind === 'event') {
    const result = validateWithSchema(EventMessageSchema, parsed);
    return result.success
      ? { kind: 'event', message: result.data }
      : { kind: 'ignored' };
  }
  return { kind: 'ignored' };
}
