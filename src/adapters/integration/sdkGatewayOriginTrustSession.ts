/**
 * Origin TOFU gate after handshake / before pairing+auth (DI-11 / ADR-0018).
 */

import type { CommandType, WireMessage } from "@axata/axatalk-protocol";
import type { SdkOriginTrustState } from "@domain/index.js";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import { createSdkIsoTimestamp, createSdkOpaqueId } from "./sdkGatewayIds.js";
import { buildCommandFailureReply, type SdkGatewayIdentity } from "./sdkGatewayMessages.js";
import type {
  SdkOriginTrustApprover,
  SdkOriginTrustDecision,
  SdkOriginTrustPending,
} from "./sdkGatewayOriginTrustApprover.js";
import type { SdkGatewayLogFn } from "./localWsServerHelpers.js";

export type SdkOriginTrustSessionContext = Readonly<{
  connection: SdkGatewayConnection;
  getOriginTrustState: (origin: string) => SdkOriginTrustState;
  originTrustApprover: SdkOriginTrustApprover;
  onOriginTrustDecision: (
    input: Readonly<{
      origin: string;
      decision: SdkOriginTrustDecision;
    }>,
  ) => void;
  getIdentity: () => SdkGatewayIdentity | null;
  sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  closeConnection: (connection: SdkGatewayConnection, reason: string) => void;
  now: () => Date;
  log: SdkGatewayLogFn;
}>;

export type EnsureSdkOriginTrustedResult =
  | Readonly<{ allowed: true }>
  | Readonly<{ allowed: false; originTrustRequestId: string }>;

/**
 * Ensures Origin is allowed before pairing/auth. Unknown → TOFU (deduped per Origin).
 */
export async function ensureSdkOriginTrusted(
  ctx: SdkOriginTrustSessionContext,
): Promise<EnsureSdkOriginTrustedResult> {
  const origin = ctx.connection.origin;
  const state = ctx.getOriginTrustState(origin);
  if (state === "allowed") {
    return { allowed: true };
  }
  if (state === "denied") {
    return {
      allowed: false,
      originTrustRequestId: createSdkOpaqueId("origin"),
    };
  }

  const pending: SdkOriginTrustPending = {
    originTrustRequestId: createSdkOpaqueId("origin"),
    origin,
    createdAt: createSdkIsoTimestamp(ctx.now),
  };
  ctx.log("sdk_gateway_origin_trust_pending", { origin });
  const decision = await ctx.originTrustApprover(pending);
  ctx.onOriginTrustDecision({ origin, decision });
  if (decision.decision === "allow") {
    ctx.log("sdk_gateway_origin_trust_allowed", { origin });
    return { allowed: true };
  }
  ctx.log("sdk_gateway_origin_trust_denied", { origin });
  return {
    allowed: false,
    originTrustRequestId: pending.originTrustRequestId,
  };
}

/**
 * Terminal Origin Deny wire signal then close.
 * Uses the TOFU `originTrustRequestId` as reply correlation (not a synthetic literal).
 * `commandType` defaults to `sdk:ping` (auth-only channel) when deny is not tied to a
 * product command — pairing/auth paths pass the same opaque id via details.
 */
export function rejectSdkOriginTrustDenied(
  ctx: SdkOriginTrustSessionContext,
  options: Readonly<{
    originTrustRequestId: string;
    commandType?: CommandType;
  }>,
): void {
  const identity = ctx.getIdentity();
  if (identity !== null) {
    ctx.sendJson(
      ctx.connection,
      buildCommandFailureReply({
        requestId: options.originTrustRequestId,
        commandType: options.commandType ?? "sdk:ping",
        code: "forbidden",
        identity,
        now: ctx.now,
        details: {
          origin_denied: true,
          originTrustRequestId: options.originTrustRequestId,
        },
      }),
    );
  }
  ctx.closeConnection(ctx.connection, "origin_denied");
}
