/**
 * - Purpose: typed OCP external-command payloads for future ExternalClientGateway (F-028 E-12).
 * - Inputs: unknown payloads from ExternalCommandRouter / SDK (not window global APIs).
 * - Outputs: narrowed request shapes or null; session-state response type.
 */

import type { OcpConnectionState } from "@domain/integration/ocp/OcpConnectionState.js";

/** Logical command channels — mapped by future ExternalCommandRouter over WS. */
export const OCP_HOST_API_CHANNELS = {
  authenticate: "ocp:authenticate",
  changeStatusReady: "ocp:change-status-ready",
  changeStatusBreak: "ocp:change-status-break",
  getSessionState: "ocp:get-session-state",
  logout: "ocp:logout",
  disconnect: "ocp:disconnect",
} as const;

export type OcpHostApiChannel =
  (typeof OCP_HOST_API_CHANNELS)[keyof typeof OCP_HOST_API_CHANNELS];

export type OcpAuthenticatePayload = Readonly<{
  ocpDomain: string;
  ocpAuthToken: string;
}>;

export type OcpChangeStatusReadyPayload = Readonly<{
  reasonId?: number;
}>;

export type OcpChangeStatusBreakPayload = Readonly<{
  reasonId: number;
}>;

export type OcpLogoutPayload = Readonly<{
  reasonId: number;
}>;

export type OcpHostSessionStateResponse = Readonly<{
  connectionState: OcpConnectionState;
}>;

/** Default reason when external ready command omits reasonId. */
export const OCP_EXTERNAL_DEFAULT_READY_REASON_ID = 0;

const MAX_DOMAIN_LENGTH = 253;
const MAX_TOKEN_LENGTH = 4096;

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
}

/**
 * - Purpose: validate external authenticate payload at boundary.
 * - Inputs: unknown command body (domain + token).
 * - Outputs: trimmed domain/token or null when invalid.
 */
export function parseOcpAuthenticatePayload(value: unknown): OcpAuthenticatePayload | null {
  const record = asRecord(value);
  if (record === null) {
    return null;
  }

  const ocpDomain = record["ocpDomain"];
  const ocpAuthToken = record["ocpAuthToken"];
  if (typeof ocpDomain !== "string" || typeof ocpAuthToken !== "string") {
    return null;
  }

  const domain = ocpDomain.trim();
  const token = ocpAuthToken.trim();
  if (domain.length === 0 || token.length === 0) {
    return null;
  }
  if (domain.length > MAX_DOMAIN_LENGTH || token.length > MAX_TOKEN_LENGTH) {
    return null;
  }

  return { ocpDomain: domain, ocpAuthToken: token };
}

/**
 * - Purpose: validate optional ready-status reason id from external command.
 * - Inputs: unknown payload (empty object / reasonId optional).
 * - Outputs: typed payload or null when reasonId is present but invalid.
 */
export function parseOcpChangeStatusReadyPayload(
  value: unknown,
): OcpChangeStatusReadyPayload | null {
  if (value === undefined || value === null) {
    return {};
  }

  const record = asRecord(value);
  if (record === null) {
    return null;
  }

  if (!("reasonId" in record) || record["reasonId"] === undefined) {
    return {};
  }

  const reasonId = record["reasonId"];
  if (!isFiniteInteger(reasonId)) {
    return null;
  }

  return { reasonId };
}

/**
 * - Purpose: validate required break-status reason id from external command.
 * - Inputs: unknown payload with reasonId.
 * - Outputs: typed payload or null when reasonId missing/invalid.
 */
export function parseOcpChangeStatusBreakPayload(
  value: unknown,
): OcpChangeStatusBreakPayload | null {
  const record = asRecord(value);
  if (record === null) {
    return null;
  }

  const reasonId = record["reasonId"];
  if (!isFiniteInteger(reasonId)) {
    return null;
  }

  return { reasonId };
}

/**
 * - Purpose: validate external logout payload at boundary.
 * - Inputs: unknown payload with required reasonId.
 * - Outputs: typed payload or null when reasonId missing/invalid.
 */
export function parseOcpLogoutPayload(value: unknown): OcpLogoutPayload | null {
  const record = asRecord(value);
  if (record === null) {
    return null;
  }

  const reasonId = record["reasonId"];
  if (!isFiniteInteger(reasonId)) {
    return null;
  }

  return { reasonId };
}

const CONNECTION_STATES: ReadonlySet<OcpConnectionState> = new Set([
  "disconnected",
  "connecting",
  "connected",
  "authenticated",
  "reconnecting",
  "sessionClosed",
  "failed",
]);

/**
 * - Purpose: validate get-session-state response at boundary.
 * - Inputs: unknown response object.
 * - Outputs: typed session state or null.
 */
export function parseOcpHostSessionStateResponse(
  value: unknown,
): OcpHostSessionStateResponse | null {
  const record = asRecord(value);
  if (record === null) {
    return null;
  }

  const connectionState = record["connectionState"];
  if (typeof connectionState !== "string") {
    return null;
  }
  if (!CONNECTION_STATES.has(connectionState as OcpConnectionState)) {
    return null;
  }

  return { connectionState: connectionState as OcpConnectionState };
}
