/**
 * Typed IPC envelopes for the main↔renderer SDK broker (F-011 / DI-02 / ADR-0009).
 * Structural fail-closed parsers only — full wire validation uses `@axata/axatalk-protocol`
 * in main/renderer adapters, not in preload.
 */

import {
  PROTOCOL_ERROR_CODES,
  type ProtocolErrorCode,
  type WireJsonObject,
} from "@axata/axatalk-protocol";

const PROTOCOL_ERROR_CODE_SET: ReadonlySet<string> = new Set(PROTOCOL_ERROR_CODES);

export type SdkBrokerRequestIpcPayload = Readonly<{
  brokerRequestId: string;
  command: unknown;
  /** Authenticated SDK clientId for ownership checks (DI-06). */
  clientId?: string;
  /** Exact Origin of the authenticated connection (DI-11 activate consent). */
  origin?: string;
}>;

export type SdkBrokerReplySuccessIpcPayload = Readonly<{
  brokerRequestId: string;
  ok: true;
  reply: unknown;
}>;

export type SdkBrokerReplyFailureIpcPayload = Readonly<{
  brokerRequestId: string;
  ok: false;
  code: ProtocolErrorCode;
  currentRevision?: number;
  details?: WireJsonObject;
}>;

export type SdkBrokerReplyIpcPayload =
  | SdkBrokerReplySuccessIpcPayload
  | SdkBrokerReplyFailureIpcPayload;

export type SdkBrokerReadyIpcPayload = Readonly<{
  ready: boolean;
}>;

export type SdkBrokerReadyIpcResponse = Readonly<{
  ok: boolean;
}>;

export type SdkBrokerReplyIpcResponse = Readonly<{
  ok: boolean;
}>;

/** Main → renderer: authenticated client socket ended (clear pending logout only). */
export type SdkBrokerClientSessionEndedIpcPayload = Readonly<{
  clientId: string;
}>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}

export function isProtocolErrorCode(value: unknown): value is ProtocolErrorCode {
  return typeof value === "string" && PROTOCOL_ERROR_CODE_SET.has(value);
}

/**
 * - Purpose: validate main→renderer broker request envelope at preload/IPC boundary.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed payload or null when invalid.
 */
export function parseSdkBrokerRequestIpcPayload(
  value: unknown,
): SdkBrokerRequestIpcPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  const brokerRequestId = candidate["brokerRequestId"];
  if (!isNonEmptyString(brokerRequestId)) {
    return null;
  }
  if (!("command" in candidate)) {
    return null;
  }
  const clientId = candidate["clientId"];
  if (
    clientId !== undefined &&
    (typeof clientId !== "string" ||
      clientId.length === 0 ||
      clientId.length > 128)
  ) {
    return null;
  }
  const origin = candidate["origin"];
  if (
    origin !== undefined &&
    (typeof origin !== "string" ||
      origin.length === 0 ||
      origin.length > 253)
  ) {
    return null;
  }
  return {
    brokerRequestId,
    command: candidate["command"],
    ...(typeof clientId === "string" ? { clientId } : {}),
    ...(typeof origin === "string" ? { origin } : {}),
  };
}

/**
 * - Purpose: validate renderer→main broker reply envelope at preload/IPC boundary.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed payload or null when invalid.
 */
export function parseSdkBrokerReplyIpcPayload(
  value: unknown,
): SdkBrokerReplyIpcPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  const brokerRequestId = candidate["brokerRequestId"];
  const ok = candidate["ok"];
  if (!isNonEmptyString(brokerRequestId) || typeof ok !== "boolean") {
    return null;
  }
  if (ok) {
    if (!("reply" in candidate)) {
      return null;
    }
    return {
      brokerRequestId,
      ok: true,
      reply: candidate["reply"],
    };
  }
  const code = candidate["code"];
  if (!isProtocolErrorCode(code)) {
    return null;
  }
  const currentRevision = candidate["currentRevision"];
  if (
    currentRevision !== undefined &&
    (typeof currentRevision !== "number" ||
      !Number.isInteger(currentRevision) ||
      currentRevision < 0)
  ) {
    return null;
  }
  const details = candidate["details"];
  if (
    details !== undefined &&
    (typeof details !== "object" || details === null || Array.isArray(details))
  ) {
    return null;
  }
  return {
    brokerRequestId,
    ok: false,
    code,
    ...(typeof currentRevision === "number" ? { currentRevision } : {}),
    ...(details !== undefined ? { details: details as WireJsonObject } : {}),
  };
}

/**
 * - Purpose: validate renderer→main readiness signal.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed payload or null when invalid.
 */
export function parseSdkBrokerReadyIpcPayload(
  value: unknown,
): SdkBrokerReadyIpcPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  const ready = candidate["ready"];
  if (typeof ready !== "boolean") {
    return null;
  }
  return { ready };
}

/**
 * - Purpose: validate main→renderer client-session-ended envelope.
 * - Inputs: unknown IPC payload.
 * - Outputs: typed payload or null when invalid.
 */
export function parseSdkBrokerClientSessionEndedIpcPayload(
  value: unknown,
): SdkBrokerClientSessionEndedIpcPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  const clientId = candidate["clientId"];
  if (!isNonEmptyString(clientId)) {
    return null;
  }
  return { clientId };
}

/**
 * - Purpose: validate ack responses for ready/reply invokes.
 * - Inputs: unknown IPC response.
 * - Outputs: typed response or null when invalid.
 */
export function parseSdkBrokerAckResponse(
  value: unknown,
): SdkBrokerReadyIpcResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate["ok"] !== "boolean") {
    return null;
  }
  return { ok: candidate["ok"] };
}
