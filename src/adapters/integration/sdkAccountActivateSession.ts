/**
 * Sync account.activate on live connections from Origin matrix (not Settings grant).
 */

import type { CapabilityId } from "@axata/axatalk-protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  elevateAccountActivateCapability,
  stripAccountActivateCapability,
} from "./sdkAccountActivateCapability.js";

const ACTIVATE: CapabilityId = "account.activate";

export function originPolicyAllowsAccountActivate(
  originPolicyCapabilities: readonly CapabilityId[],
): boolean {
  return originPolicyCapabilities.includes(ACTIVATE);
}

/**
 * Elevate or strip account.activate on the connection to match Origin matrix.
 * Returns true when grantedCapabilities changed.
 */
export function syncAccountActivateCapabilityFromOriginPolicy(
  connection: SdkGatewayConnection,
  originPolicyCapabilities: readonly CapabilityId[],
): boolean {
  const allow = originPolicyAllowsAccountActivate(originPolicyCapabilities);
  const has = connection.grantedCapabilities.includes(ACTIVATE);
  if (allow && !has) {
    elevateAccountActivateCapability(connection);
    return true;
  }
  if (!allow && has) {
    stripAccountActivateCapability(connection);
    return true;
  }
  return false;
}

/**
 * Pairing / auth grant list: add account.activate when Origin matrix enables it.
 * Pairing defaults still never include it; matrix is the operator switch.
 */
export function withOriginMatrixAccountActivate(
  grants: readonly CapabilityId[],
  originPolicyCapabilities: readonly CapabilityId[],
): readonly CapabilityId[] {
  const allow = originPolicyAllowsAccountActivate(originPolicyCapabilities);
  const has = grants.includes(ACTIVATE);
  if (allow && !has) {
    return [...grants, ACTIVATE];
  }
  if (!allow && has) {
    return grants.filter((id) => id !== ACTIVATE);
  }
  return grants;
}
