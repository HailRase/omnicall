/**
 * Client-side requested capability sanitization (ADR-0016).
 * Never auto-escalates; privileged caps never enter default requests.
 */

import {
  defaultCapabilitiesForProfile,
  isPrivilegedCapability,
  type CapabilityId,
  type PairingProfile
} from '@softomnitel/omnicall-protocol';

export function sanitizeRequestedCapabilities(input: {
  readonly profile: PairingProfile;
  readonly requested: readonly CapabilityId[];
}): readonly CapabilityId[] {
  const profileDefaults = new Set(defaultCapabilitiesForProfile(input.profile));
  const out: CapabilityId[] = [];
  for (const id of input.requested) {
    if (isPrivilegedCapability(id)) {
      continue;
    }
    if (!profileDefaults.has(id)) {
      continue;
    }
    if (!out.includes(id)) {
      out.push(id);
    }
  }
  if (out.length === 0) {
    return defaultCapabilitiesForProfile(input.profile).filter(
      (id) => !isPrivilegedCapability(id)
    );
  }
  return out;
}
