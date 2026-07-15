import { describe, expect, it } from "vitest";
import {
  OCP_HOST_API_CHANNELS,
  parseOcpAuthenticatePayload,
  parseOcpChangeStatusBreakPayload,
  parseOcpChangeStatusReadyPayload,
  parseOcpHostSessionStateResponse,
  parseOcpLogoutPayload,
} from "./OcpHostApiContract.js";

describe("OcpHostApiContract", () => {
  it("exposes stable channel constants without any", () => {
    expect(OCP_HOST_API_CHANNELS.authenticate).toBe("ocp:authenticate");
    expect(OCP_HOST_API_CHANNELS.changeStatusReady).toBe("ocp:change-status-ready");
    expect(OCP_HOST_API_CHANNELS.changeStatusBreak).toBe("ocp:change-status-break");
    expect(OCP_HOST_API_CHANNELS.getSessionState).toBe("ocp:get-session-state");
    expect(OCP_HOST_API_CHANNELS.logout).toBe("ocp:logout");
    expect(OCP_HOST_API_CHANNELS.disconnect).toBe("ocp:disconnect");
  });

  it("parses authenticate payload and trims fields", () => {
    expect(
      parseOcpAuthenticatePayload({
        ocpDomain: "  ocp.example.com  ",
        login: "  agent1  ",
        apiKey: "  key-value  ",
      }),
    ).toEqual({
      ocpDomain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-value",
    });
  });

  it("rejects legacy ocpAuthToken-only payload", () => {
    expect(
      parseOcpAuthenticatePayload({
        ocpDomain: "ocp.example.com",
        ocpAuthToken: "legacy-token",
      }),
    ).toBeNull();
  });

  it("rejects authenticate payload with empty domain, login, or apiKey", () => {
    expect(
      parseOcpAuthenticatePayload({ ocpDomain: " ", login: "agent", apiKey: "key" }),
    ).toBeNull();
    expect(
      parseOcpAuthenticatePayload({
        ocpDomain: "ocp.example.com",
        login: "",
        apiKey: "key",
      }),
    ).toBeNull();
    expect(
      parseOcpAuthenticatePayload({
        ocpDomain: "ocp.example.com",
        login: "agent",
        apiKey: "",
      }),
    ).toBeNull();
  });

  it("parses ready payload with optional reasonId", () => {
    expect(parseOcpChangeStatusReadyPayload(undefined)).toEqual({});
    expect(parseOcpChangeStatusReadyPayload({})).toEqual({});
    expect(parseOcpChangeStatusReadyPayload({ reasonId: 3 })).toEqual({ reasonId: 3 });
  });

  it("rejects ready payload with non-integer reasonId", () => {
    expect(parseOcpChangeStatusReadyPayload({ reasonId: 1.5 })).toBeNull();
    expect(parseOcpChangeStatusReadyPayload({ reasonId: "1" })).toBeNull();
  });

  it("parses break payload with required reasonId", () => {
    expect(parseOcpChangeStatusBreakPayload({ reasonId: 7 })).toEqual({ reasonId: 7 });
  });

  it("rejects break payload without reasonId", () => {
    expect(parseOcpChangeStatusBreakPayload({})).toBeNull();
    expect(parseOcpChangeStatusBreakPayload(null)).toBeNull();
  });

  it("parses logout payload with required reasonId", () => {
    expect(parseOcpLogoutPayload({ reasonId: 9 })).toEqual({ reasonId: 9 });
  });

  it("rejects logout payload without reasonId", () => {
    expect(parseOcpLogoutPayload({})).toBeNull();
    expect(parseOcpLogoutPayload(null)).toBeNull();
  });

  it("parses session state response", () => {
    expect(
      parseOcpHostSessionStateResponse({ connectionState: "authenticated" }),
    ).toEqual({ connectionState: "authenticated" });
    expect(parseOcpHostSessionStateResponse({ connectionState: "bogus" })).toBeNull();
  });
});
