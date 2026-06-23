import type { OperatorSessionId } from "../shared/ids.js";
import type { SipAccountInput } from "../telephony/SipAccount.js";

export type OperatorSession = Readonly<{
  id: OperatorSessionId;
  token: string;
  domain: string;
  agentId: string;
}>;

export type OcpAuthFailureReason =
  | "invalid_token"
  | "session_exists"
  | "access_denied"
  | "network_error"
  | "unknown";

export type OcpSipCredentials = Readonly<SipAccountInput>;

export type OcpAuthResult =
  | Readonly<{
      status: "succeeded";
      session: OperatorSession;
      sipCredentials: OcpSipCredentials;
    }>
  | Readonly<{
      status: "failed";
      reason: OcpAuthFailureReason;
      message: string;
    }>;
