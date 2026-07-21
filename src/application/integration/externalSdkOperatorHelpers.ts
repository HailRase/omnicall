/**
 * Pure helpers for ExternalSdkOperatorHandler (DI-07).
 */

import type { WireJsonObject } from "@axata/axatalk-protocol";
import type { ExternalHandlerResult } from "@ports/integration/ExternalCommandHandler.js";

import type { SdkOperatorReasonDto } from "./ExternalSdkOperatorPort.js";
import { sdkFail } from "./externalSdkCallHelpers.js";

export function interactionRequired(
  logoutToken: string,
  reasons: ReadonlyArray<SdkOperatorReasonDto>,
): ExternalHandlerResult {
  return {
    ok: false,
    code: "interaction_required",
    retryable: false,
    details: {
      logoutToken,
      reasons: reasons.map(reasonToWire),
    },
  };
}

export function defaultLogoutToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return `logout_${hex}`;
}

export function reasonToWire(reason: SdkOperatorReasonDto): WireJsonObject {
  return { id: reason.id, label: reason.label, kind: reason.kind };
}

export function parseChangeStatusPayload(
  payload: unknown,
): { readonly target: "ready" | "break"; readonly reasonId?: number } | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const target = record["target"];
  if (target !== "ready" && target !== "break") {
    return null;
  }
  const reasonId = record["reasonId"];
  if (reasonId === undefined) {
    return { target };
  }
  if (
    typeof reasonId !== "number" ||
    !Number.isInteger(reasonId) ||
    reasonId < 0
  ) {
    return null;
  }
  return { target, reasonId };
}

export function parseConfirmLogoutPayload(
  payload: unknown,
): { readonly logoutToken: string; readonly reasonId?: number } | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const logoutToken = record["logoutToken"];
  if (typeof logoutToken !== "string" || logoutToken.length === 0) {
    return null;
  }
  const reasonId = record["reasonId"];
  if (reasonId === undefined) {
    return { logoutToken };
  }
  if (
    typeof reasonId !== "number" ||
    !Number.isInteger(reasonId) ||
    reasonId < 0
  ) {
    return null;
  }
  return { logoutToken, reasonId };
}

export function assertClientId(
  clientId: string | undefined,
): ExternalHandlerResult | null {
  if (clientId === undefined || clientId.length === 0) {
    return sdkFail("unauthenticated");
  }
  return null;
}
