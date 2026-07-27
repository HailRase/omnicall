import { z } from 'zod';

import {
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
