/**
 * Inbound parse + dispatch for LocalWsSessionRegistry (keeps registry under size budget).
 */

import type { WireMessage } from "@axata/axatalk-protocol";

import type { SdkAuthChallengeCache } from "./sdkGatewayAuthChallenge.js";
import type { SdkGatewayLimits } from "./sdkGatewayConfig.js";
import {
  enqueueSdkGatewayInbound,
  type SdkGatewayConnection,
} from "./sdkGatewayConnection.js";
import type { SdkGatewayIdentity } from "./sdkGatewayMessages.js";
import type { SdkPairingApprover } from "./sdkGatewayPairingTypes.js";
import type { SdkGatewayPairingStore } from "./sdkGatewayPairingStore.js";
import type { SdkGatewayProductSurface } from "./sdkGatewayProductSurface.js";
import type { SdkRequestDedupCache } from "./sdkGatewayRequestDedup.js";
import type {
  SdkOriginTrustApprover,
  SdkOriginTrustDecision,
} from "./sdkGatewayOriginTrustApprover.js";
import type { SdkOriginTrustState } from "@domain/index.js";
import type { CapabilityId } from "@axata/axatalk-protocol";
import { dispatchSdkValidatedMessage } from "./sdkGatewaySessionDispatch.js";
import { startSdkGatewayHeartbeat } from "./sdkGatewaySessionSocket.js";
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
  getOriginTrustState: (origin: string) => SdkOriginTrustState;
  originTrustApprover: SdkOriginTrustApprover;
  onOriginTrustDecision: (
    input: Readonly<{ origin: string; decision: SdkOriginTrustDecision }>,
  ) => void;
  getOriginMatrixCapabilities: (origin: string) => readonly CapabilityId[];
  challenges: SdkAuthChallengeCache;
  requestDedup: SdkRequestDedupCache;
  now: () => Date;
  connectionCount: number;
  limits: SdkGatewayLimits;
  productSurface: SdkGatewayProductSurface | null;
  sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  isSessionExpired: (connection: SdkGatewayConnection) => boolean;
  log: SdkGatewayLogFn;
}>;

/**
 * Parse one WS text frame and dispatch a validated wire message.
 * Async dispatch is serialized per connection (receive order).
 */
export function parseAndDispatchLocalWsSession(
  deps: LocalWsSessionInboundDeps,
): void {
  enqueueSdkGatewayInbound(deps.connection, async () => {
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
    await dispatchSdkValidatedMessage({
      connection: deps.connection,
      message: validated.data,
      getIdentity: deps.getIdentity,
      pairingStore: deps.pairingStore,
      pairingApprover: deps.pairingApprover,
      getOriginTrustState: deps.getOriginTrustState,
      originTrustApprover: deps.originTrustApprover,
      onOriginTrustDecision: deps.onOriginTrustDecision,
      getOriginMatrixCapabilities: deps.getOriginMatrixCapabilities,
      challenges: deps.challenges,
      requestDedup: deps.requestDedup,
      now: deps.now,
      connectionCount: deps.connectionCount,
      heartbeatSeconds: deps.limits.heartbeatSeconds,
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
  });
}
