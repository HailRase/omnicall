/**
 * Client revoke for LocalWsSessionRegistry.
 */

import type { WireMessage } from "@softomnitel/omnicall-protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildSdkRevokedEvent,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import type { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";

export async function revokeLocalWsClient(input: {
  readonly clientId: string;
  readonly pairingStore: SdkGatewayPairingStore;
  readonly connections: Map<string, SdkGatewayConnection>;
  readonly getIdentity: () => SdkGatewayIdentity | null;
  readonly now: () => Date;
  readonly sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  readonly closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  readonly log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
  readonly nextRevokeSequence: () => number;
}): Promise<boolean> {
  const ok = await input.pairingStore.revoke(input.clientId);
  if (!ok) {
    return false;
  }
  const identity = input.getIdentity();
  for (const connection of [...input.connections.values()]) {
    if (connection.clientId !== input.clientId) {
      continue;
    }
    if (identity !== null) {
      input.sendJson(
        connection,
        buildSdkRevokedEvent({
          identity,
          now: input.now,
          sequence: input.nextRevokeSequence(),
          reasonCode: "revoked",
        }),
      );
    }
    connection.authState = "revoked";
    input.closeConnection(connection, "revoked");
  }
  input.log("sdk_gateway_client_revoked", {
    clientId: input.clientId,
    result: "revoked",
  });
  return true;
}
