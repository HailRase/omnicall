/**
 * Pure helpers for ExternalSdkCallHandler (DI-06).
 */

import type { ProtocolErrorCode, WireJsonObject } from "@softomnitel/omnicall-protocol";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { ExternalHandlerResult } from "@ports/integration/ExternalCommandHandler.js";

import { isSipNotRegisteredError } from "@shared/telephony/sipOutboundErrors.js";

import { mapPlatformErrorToSdkCode } from "./mapPlatformErrorToSdkCode.js";

export function sdkCallSuccess(
  result: WireJsonObject,
  revision: number,
): ExternalHandlerResult {
  return { ok: true, result, revision };
}

export function sdkCallStale(currentRevision: number): ExternalHandlerResult {
  return {
    ok: false,
    code: "stale_state",
    retryable: false,
    currentRevision,
  };
}

export function mapUcResultToSdk(
  result: Result<unknown, PlatformError>,
): ExternalHandlerResult {
  if (!result.ok) {
    return mapPlatformErrorToSdkFailure(result.error);
  }
  return { ok: true, result: {}, revision: 0 };
}

/**
 * Full SDK failure including allowlisted details (originate SIP preflight).
 */
export function mapPlatformErrorToSdkFailure(
  error: PlatformError,
): ExternalHandlerResult {
  if (isSipNotRegisteredError(error)) {
    return sdkFail("operation_failed", { failure_kind: "sip_not_registered" });
  }
  return sdkFail(mapPlatformErrorToSdkCode(error));
}

export function readExpectedRevision(payload: unknown): number | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  if (!("expectedRevision" in payload)) {
    return null;
  }
  const value = payload.expectedRevision;
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

export function readStringField(payload: unknown, key: string): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  if (!(key in payload)) {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export function sdkFail(
  code: ProtocolErrorCode,
  details?: WireJsonObject,
): ExternalHandlerResult {
  return {
    ok: false,
    code,
    retryable: false,
    ...(details !== undefined ? { details } : {}),
  };
}
