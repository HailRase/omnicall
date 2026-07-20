/**
 * Session helpers for short-lived account.activate grants (DI-08).
 */

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  elevateAccountActivateCapability,
  stripAccountActivateCapability,
} from "./sdkAccountActivateCapability.js";
import type {
  IssueSdkAccountActivateGrantResult,
  SdkAccountActivateGrantStore,
} from "./sdkAccountActivateGrantStore.js";

/**
 * Issue grant and elevate authenticated connections for the client.
 */
export function issueAccountActivateGrantOnSessions(input: {
  readonly activateGrantStore: SdkAccountActivateGrantStore;
  readonly connections: Iterable<SdkGatewayConnection>;
  readonly clientId: string;
  readonly profileId: string;
  readonly nowMs: number;
  readonly ttlMs?: number;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
}): IssueSdkAccountActivateGrantResult {
  const issued = input.activateGrantStore.issue({
    clientId: input.clientId,
    profileId: input.profileId,
    nowMs: input.nowMs,
    ...(input.ttlMs !== undefined ? { ttlMs: input.ttlMs } : {}),
  });
  if (!issued.ok) {
    return issued;
  }
  for (const connection of input.connections) {
    if (
      connection.clientId === input.clientId &&
      connection.authState === "authenticated"
    ) {
      elevateAccountActivateCapability(connection);
    }
  }
  input.log("sdk_gateway_activate_grant_issued", {
    clientId: input.clientId,
    result: "issued",
  });
  return issued;
}

/**
 * After prune: strip account.activate when the client has no remaining valid grants.
 * Call before capability routing so expired grants fail closed at the capability gate.
 */
export function syncAccountActivateCapabilityForConnection(
  connection: SdkGatewayConnection,
  activateGrantStore: SdkAccountActivateGrantStore,
  nowMs: number,
): void {
  const clientId = connection.clientId;
  if (clientId === null || clientId.length === 0) {
    return;
  }
  activateGrantStore.prune(nowMs);
  if (!activateGrantStore.hasAnyValidGrant(clientId, nowMs)) {
    stripAccountActivateCapability(connection);
  }
}

/**
 * Clear grants for client and strip activate from matching live connections.
 */
export function clearAccountActivateGrantsForClient(input: {
  readonly activateGrantStore: SdkAccountActivateGrantStore;
  readonly connections: Iterable<SdkGatewayConnection>;
  readonly clientId: string;
}): void {
  input.activateGrantStore.clearForClient(input.clientId);
  for (const connection of input.connections) {
    if (connection.clientId === input.clientId) {
      stripAccountActivateCapability(connection);
    }
  }
}
