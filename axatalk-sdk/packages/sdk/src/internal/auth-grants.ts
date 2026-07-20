/**
 * Server-authoritative capability grant parsing (fail closed).
 */

import { CapabilityIdSchema, type CapabilityId } from '@axatalk/protocol';

export function parseGrantedCapabilities(
  values: readonly string[]
): readonly CapabilityId[] | undefined {
  const out: CapabilityId[] = [];
  for (const value of values) {
    const parsed = CapabilityIdSchema.safeParse(value);
    if (!parsed.success) {
      return undefined;
    }
    out.push(parsed.data);
  }
  return out;
}
