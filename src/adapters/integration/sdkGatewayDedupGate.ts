/**
 * Shared begin-gate helpers for SDK command dedup (ADR-0027 §D).
 * - Purpose: apply execute/replay/await/rejected without cross-client steal.
 * - Inputs: principal, cache, identity, sendJson.
 * - Outputs: execute continue | terminal (replay/await/reject handled).
 */

import type { CommandType, WireMessage } from "@softomnitel/omnicall-protocol";

import type { SdkGatewayConnection } from "./sdkGatewayConnection.js";
import {
  buildCommandFailureReply,
  type SdkGatewayIdentity,
} from "./sdkGatewayMessages.js";
import {
  createSdkDedupPrincipal,
  type SdkDedupPrincipal,
  type SdkRequestDedupCache,
} from "./sdkGatewayRequestDedup.js";

export type SdkDedupGateContext = Readonly<{
  connection: SdkGatewayConnection;
  requestDedup: SdkRequestDedupCache;
  requestId: string;
  commandType: CommandType;
  identity: SdkGatewayIdentity;
  now: () => Date;
  sendJson: (connection: SdkGatewayConnection, message: WireMessage) => void;
  log: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
}>;

export type SdkDedupGateResult =
  | { readonly action: "execute"; readonly principal: SdkDedupPrincipal }
  | { readonly action: "terminal" };

/** Run begin; on non-execute, deliver reply / wait / capacity deny. */
export async function gateSdkCommandDedup(
  input: SdkDedupGateContext,
): Promise<SdkDedupGateResult> {
  const principal = createSdkDedupPrincipal(input.connection, input.requestId);
  const dedup = input.requestDedup.begin(principal, input.now().getTime());
  if (dedup.action === "execute") {
    return { action: "execute", principal };
  }
  if (dedup.action === "replay") {
    input.sendJson(input.connection, dedup.reply);
    return { action: "terminal" };
  }
  if (dedup.action === "rejected") {
    const reply = buildCommandFailureReply({
      requestId: input.requestId,
      commandType: input.commandType,
      code: "rate_limited",
      identity: input.identity,
      now: input.now,
      details: { dedup_capacity: true },
    });
    input.sendJson(input.connection, reply);
    input.log("sdk_gateway_command", {
      commandType: input.commandType,
      requestId: input.requestId,
      result: "rate_limited",
    });
    return { action: "terminal" };
  }
  const settled = await dedup.promise;
  if (settled.outcome === "reply") {
    input.sendJson(input.connection, settled.reply);
  }
  return { action: "terminal" };
}
