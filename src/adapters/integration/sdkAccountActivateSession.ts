/**
 * Sync privileged Origin-matrix capabilities on live connections
 * (`account.activate`, `window.hide` — ADR-0013/0018).
 */

import type { CapabilityId } from "@axata/axatalk-protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  elevateAccountActivateCapability,
  stripAccountActivateCapability,
} from "./sdkAccountActivateCapability.js";

const ACTIVATE: CapabilityId = "account.activate";
const WINDOW_HIDE: CapabilityId = "window.hide";

/** Privileged caps elevated only from Origin matrix (never pairing defaults). */
export const MATRIX_PRIVILEGED_CAPABILITIES = [ACTIVATE, WINDOW_HIDE] as const;

export function originPolicyAllowsAccountActivate(
  originPolicyCapabilities: readonly CapabilityId[],
): boolean {
  return originPolicyCapabilities.includes(ACTIVATE);
}

export function originPolicyAllowsWindowHide(
  originPolicyCapabilities: readonly CapabilityId[],
): boolean {
  return originPolicyCapabilities.includes(WINDOW_HIDE);
}

function elevateCapability(
  connection: SdkGatewayConnection,
  capability: CapabilityId,
): void {
  if (capability === ACTIVATE) {
    elevateAccountActivateCapability(connection);
    return;
  }
  if (!connection.grantedCapabilities.includes(capability)) {
    connection.grantedCapabilities = [
      ...connection.grantedCapabilities,
      capability,
    ];
  }
}

function stripCapability(
  connection: SdkGatewayConnection,
  capability: CapabilityId,
): void {
  if (capability === ACTIVATE) {
    stripAccountActivateCapability(connection);
    return;
  }
  if (!connection.grantedCapabilities.includes(capability)) {
    return;
  }
  connection.grantedCapabilities = connection.grantedCapabilities.filter(
    (id) => id !== capability,
  );
}

/**
 * Elevate or strip matrix-privileged caps on the connection to match Origin matrix.
 * Returns true when grantedCapabilities changed.
 */
export function syncAccountActivateCapabilityFromOriginPolicy(
  connection: SdkGatewayConnection,
  originPolicyCapabilities: readonly CapabilityId[],
): boolean {
  return syncMatrixPrivilegedCapabilitiesFromOriginPolicy(
    connection,
    originPolicyCapabilities,
  );
}

export function syncMatrixPrivilegedCapabilitiesFromOriginPolicy(
  connection: SdkGatewayConnection,
  originPolicyCapabilities: readonly CapabilityId[],
): boolean {
  let changed = false;
  for (const capability of MATRIX_PRIVILEGED_CAPABILITIES) {
    const allow = originPolicyCapabilities.includes(capability);
    const has = connection.grantedCapabilities.includes(capability);
    if (allow && !has) {
      elevateCapability(connection, capability);
      changed = true;
    } else if (!allow && has) {
      stripCapability(connection, capability);
      changed = true;
    }
  }
  return changed;
}

/**
 * Pairing / auth grant list: add privileged caps when Origin matrix enables them.
 * Pairing defaults still never include them; matrix is the operator switch.
 */
export function withOriginMatrixAccountActivate(
  grants: readonly CapabilityId[],
  originPolicyCapabilities: readonly CapabilityId[],
): readonly CapabilityId[] {
  return withOriginMatrixPrivilegedCapabilities(
    grants,
    originPolicyCapabilities,
  );
}

export function withOriginMatrixPrivilegedCapabilities(
  grants: readonly CapabilityId[],
  originPolicyCapabilities: readonly CapabilityId[],
): readonly CapabilityId[] {
  let result = [...grants];
  for (const capability of MATRIX_PRIVILEGED_CAPABILITIES) {
    const allow = originPolicyCapabilities.includes(capability);
    const has = result.includes(capability);
    if (allow && !has) {
      result = [...result, capability];
    } else if (!allow && has) {
      result = result.filter((id) => id !== capability);
    }
  }
  return result;
}
