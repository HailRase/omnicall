/**
 * Inbound parse + dispatch for LocalWsSessionRegistry (keeps registry under size budget).
 */

import type { WireMessage } from "@axata/axatalk-protocol";

import type { SdkAuthChallengeCache } from "./sdkGatewayAuthChallenge.js";
import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";
import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";
import type { SdkPairingApprover } from "./sdkGatewayPairingTypes.js";
import type { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import type { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";
import { dispatchSdkValidatedMessage } from "./sdkGatewaySessionDispatch.js";
import { startSdkGatewayHeartbeat } from "./sdkGatewaySessionSocket.js";
import type { SdkAccountActivateGrantStore } from "./sdkAccountActivateGrantStore.js";
import type { SdkGatewayLogFn } from "./localWsServerHelpers.js";

export type LocalWsSessionInboundDeps = Readonly<{
  connection: SdkGatewayConnection;
  text: string;
  validateWire: (
    input: unknown,
  ) =>
    | { success: true; data: WireMessage }
    | { success: false; code: string };
  getIdentity: () => SdkGatewayIdentity | null;
  pairingStore: SdkGatewayPairingStore;
  pairingApprover: SdkPairingApprover;
  challenges: SdkAuthChallengeCache;
  requestDedup: SdkRequestDedupCache;
  now: () => Date;
  connectionCount: number;
  limits: SdkGatewayLimits;
  activateGrantStore: SdkAccountActivateGrantStore;
  productSurface: SdkGatewayProductSurface | null;
  sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  isSessionExpired: (connection: SdkGatewayConnection) => boolean;
  log: SdkGatewayLogFn;
}>;

/**
 * Parse one WS text frame and dispatch a validated wire message.
 */
export function parseAndDispatchLocalWsSession(
  deps: LocalWsSessionInboundDeps,
): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(deps.text) as unknown;
  } catch {
    deps.closeConnection(deps.connection, "invalid_json");
    return;
  }
  const validated = deps.validateWire(parsed);
  if (!validated.success) {
    deps.closeConnection(deps.connection, validated.code);
    return;
  }
  void dispatchSdkValidatedMessage({
    connection: deps.connection,
    message: validated.data,
    getIdentity: deps.getIdentity,
    pairingStore: deps.pairingStore,
    pairingApprover: deps.pairingApprover,
    challenges: deps.challenges,
    requestDedup: deps.requestDedup,
    now: deps.now,
    connectionCount: deps.connectionCount,
    heartbeatSeconds: deps.limits.heartbeatSeconds,
    activateGrantStore: deps.activateGrantStore,
    sendJson: deps.sendJson,
    closeConnection: deps.closeConnection,
    startHeartbeat: (c) => {
      startSdkGatewayHeartbeat({
        connection: c,
        heartbeatSeconds: deps.limits.heartbeatSeconds,
        closeConnection: deps.closeConnection,
      });
    },
    log: deps.log,
    isSessionExpired: deps.isSessionExpired,
    productSurface: deps.productSurface,
  });
}
