import { z } from 'zod';

import {
  CALL_CONTROL_GRANULAR_CAPABILITIES,
  CAPABILITY_IDS,
  DEFAULT_CAPABILITY_PROFILES,
  PAIRING_PROFILES,
  PRIVILEGED_CAPABILITIES
} from './constants.js';

/** @public */
export const CapabilityIdSchema = z.enum(CAPABILITY_IDS);

/** @public */
export type CapabilityId = z.infer<typeof CapabilityIdSchema>;

/** @public */
export const PairingProfileSchema = z.enum(PAIRING_PROFILES);

/** @public */
export type PairingProfile = z.infer<typeof PairingProfileSchema>;

/** @public */
export const CapabilityIdListSchema = z.array(CapabilityIdSchema).max(32);

/** @public */
export function defaultCapabilitiesForProfile(
  profile: PairingProfile
): readonly CapabilityId[] {
  return DEFAULT_CAPABILITY_PROFILES[profile];
}

/** @public */
export function isPrivilegedCapability(id: CapabilityId): boolean {
  return (PRIVILEGED_CAPABILITIES as readonly string[]).includes(id);
}

/** @public */
export function isCapabilityInDefaultProfile(
  profile: PairingProfile,
  id: CapabilityId
): boolean {
  return (DEFAULT_CAPABILITY_PROFILES[profile] as readonly string[]).includes(id);
}

/**
 * Expand umbrella `call.control` into granular call caps (ADR-0021).
 * Does not remove `call.control` itself.
 * @public
 */
export function expandCallControlUmbrella(
  grants: readonly CapabilityId[]
): readonly CapabilityId[] {
  if (!grants.includes('call.control')) {
    return grants;
  }
  const out: CapabilityId[] = [...grants];
  for (const id of CALL_CONTROL_GRANULAR_CAPABILITIES) {
    if (!out.includes(id)) {
      out.push(id);
    }
  }
  return out;
}

/**
 * True when `required` is present or covered by umbrella `call.control`.
 * @public
 */
export function sessionHasCapability(
  granted: readonly CapabilityId[],
  required: CapabilityId | null
): boolean {
  if (required === null) {
    return true;
  }
  if (granted.includes(required)) {
    return true;
  }
  if (
    (CALL_CONTROL_GRANULAR_CAPABILITIES as readonly string[]).includes(required)
  ) {
    return granted.includes('call.control');
  }
  return false;
}
