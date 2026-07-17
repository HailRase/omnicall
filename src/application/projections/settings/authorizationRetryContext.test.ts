import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import {
  isAuthorizationRetryableStage,
  resolveAuthorizationRetryStrategy,
  type AuthorizationAttemptContext,
} from "./authorizationRetryContext.js";

const baseContext: AuthorizationAttemptContext = {
  kind: "saved_profile_ocp",
  correlationId: createCorrelationId(),
  login: "1001",
};

describe("authorizationRetryContext", () => {
  it("detects retryable failure stages when retryAvailable", () => {
    expect(isAuthorizationRetryableStage("ocp_unavailable", true)).toBe(true);
    expect(isAuthorizationRetryableStage("ready", true)).toBe(false);
    expect(isAuthorizationRetryableStage("ocp_unavailable", false)).toBe(false);
  });

  it("routes OCP unavailable to retry_ocp_server (fresh token)", () => {
    expect(
      resolveAuthorizationRetryStrategy("ocp_unavailable", baseContext, {
        isOcpSessionLive: false,
      }),
    ).toBe("retry_ocp_server");
  });

  it("routes SESSION_EXIST to retry_ocp_server never auth-only", () => {
    expect(
      resolveAuthorizationRetryStrategy("ocp_session_exist", baseContext, {
        isOcpSessionLive: false,
      }),
    ).toBe("retry_ocp_server");
  });

  it("honors dual-FSM primaryRecoveryAction for auth-only retry", () => {
    expect(
      resolveAuthorizationRetryStrategy("ocp_unavailable", baseContext, {
        isOcpSessionLive: true,
        primaryOcpRecoveryAction: "retry_authorization",
      }),
    ).toBe("retry_ocp_authorization");
  });

  it("routes SIP registration failure to register-only when OCP session is live", () => {
    expect(
      resolveAuthorizationRetryStrategy("sip_registration_failed", baseContext, {
        isOcpSessionLive: true,
      }),
    ).toBe("repeat_sip_register_only");
  });

  it("routes identity mismatch to register-only when OCP session is live", () => {
    expect(
      resolveAuthorizationRetryStrategy("ocp_connected_sip_failed", baseContext, {
        isOcpSessionLive: true,
      }),
    ).toBe("repeat_sip_register_only");
  });

  it("routes manual SIP failure to repeat SIP authorize", () => {
    const manualContext: AuthorizationAttemptContext = {
      kind: "manual_sip",
      correlationId: createCorrelationId(),
      sipIdentity: {
        username: "1001",
        domain: "pbx.example",
        server: "sip.example",
      },
    };
    expect(
      resolveAuthorizationRetryStrategy("sip_registration_failed", manualContext, {
        isOcpSessionLive: false,
      }),
    ).toBe("repeat_sip_authorize");
  });
});
