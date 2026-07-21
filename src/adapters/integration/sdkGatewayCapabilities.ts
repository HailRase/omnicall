/**
 * Capability checks and profile grants for SDK gateway (DI-04 / ADR-0011/0016).
 */

import {
  defaultCapabilitiesForProfile,
  isCapabilityInDefaultProfile,
  isPrivilegedCapability,
  type CapabilityId,
  type CommandType,
  type PairingProfile,
} from "@axata/axatalk-protocol";

/** Capability required for a command; undefined means auth-only (e.g. sdk:ping). */
const COMMAND_CAPABILITY: Readonly<
  Partial<Record<CommandType, CapabilityId>>
> = {
  "sdk:get-snapshot": "session.read.redacted",
  "window:show": "window.show",
  "window:get-state": "window.show",
  "window:hide": "window.hide",
  "operator:get-reasons": "operator.status.write",
  "operator:change-status": "operator.status.write",
  "call:originate": "call.originate",
  "call:answer": "call.control",
  "call:reject": "call.control",
  "call:hangup": "call.control",
  "call:hold": "call.control",
  "call:resume": "call.control",
  "call:mute": "call.control",
  "call:unmute": "call.control",
  "call:send-dtmf": "call.control",
  "account:activate-profile": "account.activate",
  "account:prepare-logout": "session.logout",
  "account:confirm-logout": "session.logout",
};

export function requiredCapabilityForCommand(
  commandType: CommandType,
): CapabilityId | null {
  if (commandType === "sdk:ping") {
    return null;
  }
  return COMMAND_CAPABILITY[commandType] ?? null;
}

export function connectionHasCapability(
  granted: readonly CapabilityId[],
  required: CapabilityId | null,
): boolean {
  if (required === null) {
    return true;
  }
  return granted.includes(required);
}

/**
 * Resolve grants at approve time: profile defaults ∩ requested, never privileged
 * unless already in the selected profile defaults (they are not).
 */
export function resolveGrantedCapabilities(input: {
  readonly profile: PairingProfile;
  readonly requestedCapabilities: readonly CapabilityId[];
  readonly explicitGrants?: readonly CapabilityId[];
  /** Intersect grants with Origin matrix enabled caps (ADR-0018). */
  readonly originPolicyCapabilities?: readonly CapabilityId[];
}): readonly CapabilityId[] {
  let grants: readonly CapabilityId[];
  if (input.explicitGrants !== undefined) {
    grants = filterSafeGrants(input.profile, input.explicitGrants);
  } else {
    const defaults = defaultCapabilitiesForProfile(input.profile);
    if (input.requestedCapabilities.length === 0) {
      grants = [...defaults];
    } else {
      const requestedInProfile = input.requestedCapabilities.filter((id) =>
        isCapabilityInDefaultProfile(input.profile, id),
      );
      grants = filterSafeGrants(
        input.profile,
        requestedInProfile.length > 0 ? requestedInProfile : defaults,
      );
    }
  }
  if (input.originPolicyCapabilities === undefined) {
    return grants;
  }
  const policySet = new Set<CapabilityId>(input.originPolicyCapabilities);
  return grants.filter((id) => policySet.has(id));
}

function filterSafeGrants(
  profile: PairingProfile,
  caps: readonly CapabilityId[],
): readonly CapabilityId[] {
  const allowed = new Set<CapabilityId>(defaultCapabilitiesForProfile(profile));
  return caps.filter(
    (id) => allowed.has(id) && !isPrivilegedCapability(id),
  );
}
