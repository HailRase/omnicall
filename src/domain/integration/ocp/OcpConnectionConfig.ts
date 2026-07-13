/**
 * - Purpose: validated OCP WebSocket connection parameters.
 * - Inputs: domain hostname and auth token from settings or host-page.
 * - Outputs: immutable OcpConnectionConfig value object.
 */

export type OcpConnectionConfig = Readonly<{
  domain: string;
  authToken: string;
}>;

export type OcpConnectionConfigValidationError =
  | "domain_required"
  | "auth_token_required";

export type OcpConnectionConfigResult =
  | Readonly<{ ok: true; value: OcpConnectionConfig }>
  | Readonly<{ ok: false; error: OcpConnectionConfigValidationError }>;

export function createOcpConnectionConfig(input: {
  domain: string;
  authToken: string;
}): OcpConnectionConfigResult {
  const domain = input.domain.trim();
  if (domain.length === 0) {
    return { ok: false, error: "domain_required" };
  }

  const authToken = input.authToken.trim();
  if (authToken.length === 0) {
    return { ok: false, error: "auth_token_required" };
  }

  return { ok: true, value: { domain, authToken } };
}
