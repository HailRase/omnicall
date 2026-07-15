/**
 * - Purpose: fetch ephemeral softphone_auth_token from OCP HTTP authenticate endpoint.
 * - Inputs: OCP domain, SIP login, Ocp-Proxy-Api-Key.
 * - Outputs: token or SESSION_EXIST outcome; never persists secrets.
 */

import type { CorrelationId } from "@shared/correlation-id/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type OcpProxyAuthenticateInput = Readonly<{
  domain: string;
  login: string;
  apiKey: string;
  correlationId?: CorrelationId;
}>;

export type OcpProxyAuthenticateOutcome =
  | Readonly<{ kind: "token"; token: string }>
  | Readonly<{ kind: "session_exist" }>;

export interface OcpProxyAuthenticatePort {
  authenticate(
    input: OcpProxyAuthenticateInput,
  ): Promise<Result<OcpProxyAuthenticateOutcome, PlatformError>>;
}
