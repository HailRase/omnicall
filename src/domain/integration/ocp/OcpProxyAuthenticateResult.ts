/**
 * - Purpose: domain view of HTTP /proxy/authenticate response body.
 * - Inputs: unknown JSON at adapter boundary.
 * - Outputs: token | SESSION_EXIST | parse failure reason (no secrets logged).
 */

export const OCP_SOFTPHONE_AUTH_TOKEN_SESSION_EXIST = "SESSION_EXIST" as const;

export type OcpProxyAuthenticateParseResult =
  | Readonly<{ ok: true; kind: "token"; token: string }>
  | Readonly<{ ok: true; kind: "session_exist" }>
  | Readonly<{ ok: false; reason: "invalid_shape" | "empty_token" }>;

/**
 * - Purpose: narrow HTTP authenticate JSON to token or SESSION_EXIST.
 * - Inputs: unknown response body.
 * - Outputs: typed parse result without logging token values.
 */
export function parseOcpProxyAuthenticateResponse(
  value: unknown,
): OcpProxyAuthenticateParseResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, reason: "invalid_shape" };
  }
  const record = value as Record<string, unknown>;
  const softphoneAuthToken = record["softphone_auth_token"];
  if (typeof softphoneAuthToken !== "string") {
    return { ok: false, reason: "invalid_shape" };
  }
  const trimmed = softphoneAuthToken.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "empty_token" };
  }
  if (trimmed === OCP_SOFTPHONE_AUTH_TOKEN_SESSION_EXIST) {
    return { ok: true, kind: "session_exist" };
  }
  return { ok: true, kind: "token", token: trimmed };
}
