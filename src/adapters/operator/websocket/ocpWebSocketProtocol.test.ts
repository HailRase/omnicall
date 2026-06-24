import { describe, expect, it } from "vitest";
import {
  isGatewaySuccess,
  isOcpInboundPushMessage,
  mapOcpAuthResponse,
  readAgentStatusFromRecord,
  readBreakReasonsFromRecord,
} from "./ocpWebSocketProtocol.js";

describe("ocpWebSocketProtocol", () => {
  it("maps auth success with SIP credentials", () => {
    const result = mapOcpAuthResponse(
      {
        event: "auth_success",
        agent_id: "agent-42",
        sip_username: "200",
        sip_password: "secret",
        sip_domain: "pbx.example",
        sip_server: "wss://pbx.example/ws",
        status: "ready",
        break_reasons: ["break", "meeting"],
      },
      "token-1",
      "ocp.example",
    );

    expect(result.status).toBe("succeeded");
    if (result.status !== "succeeded") {
      return;
    }
    expect(result.session.agentId).toBe("agent-42");
    expect(result.sipCredentials.username).toBe("200");
    expect(readAgentStatusFromRecord({ status: "ready" })).toBe("ready");
    expect(
      readBreakReasonsFromRecord({ break_reasons: ["break", "meeting"] }),
    ).toHaveLength(2);
  });

  it("maps SESSION_EXIST to session_exists", () => {
    const result = mapOcpAuthResponse(
      { event: "SESSION_EXIST", message: "already online" },
      "token",
      "domain",
    );

    expect(result).toEqual({
      status: "failed",
      reason: "session_exists",
      message: "already online",
    });
  });

  it("maps invalid token failures", () => {
    const result = mapOcpAuthResponse(
      { event: "auth_failed", reason: "INVALID_TOKEN" },
      "token",
      "domain",
    );

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toBe("invalid_token");
    }
  });

  it("detects inbound push events", () => {
    expect(
      isOcpInboundPushMessage({
        event: "queue_info",
        main_acallid: "acall-1",
        queue_name: "Support",
      }),
    ).toBe(true);
    expect(
      isOcpInboundPushMessage({
        event: "auth_result",
        request_id: "req-1",
        success: true,
      }),
    ).toBe(false);
  });

  it("evaluates gateway success flag", () => {
    expect(isGatewaySuccess({ success: true })).toBe(true);
    expect(isGatewaySuccess({ success: false })).toBe(false);
    expect(isGatewaySuccess({ status: "failed" })).toBe(false);
  });
});
