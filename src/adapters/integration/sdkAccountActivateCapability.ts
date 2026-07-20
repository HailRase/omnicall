/**
 * Elevate / strip short-lived account.activate on a live connection (DI-08).
 */

import type { CapabilityId } from "@axatalk/protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";

const ACTIVATE_CAPABILITY: CapabilityId = "account.activate";

export function elevateAccountActivateCapability(
  connection: SdkGatewayConnection,
): void {
  if (connection.grantedCapabilities.includes(ACTIVATE_CAPABILITY)) {
    return;
  }
  connection.grantedCapabilities = [
    ...connection.grantedCapabilities,
    ACTIVATE_CAPABILITY,
  ];
}

export function stripAccountActivateCapability(
  connection: SdkGatewayConnection,
): void {
  if (!connection.grantedCapabilities.includes(ACTIVATE_CAPABILITY)) {
    return;
  }
  connection.grantedCapabilities = connection.grantedCapabilities.filter(
    (id) => id !== ACTIVATE_CAPABILITY,
  );
}
