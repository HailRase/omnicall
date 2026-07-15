import { describe, expect, it } from "vitest";
import { parseOcpProxyAuthenticateResponse } from "./OcpProxyAuthenticateResult.js";

describe("parseOcpProxyAuthenticateResponse", () => {
  it("parses token response", () => {
    expect(
      parseOcpProxyAuthenticateResponse({ softphone_auth_token: "  abc123  " }),
    ).toEqual({ ok: true, kind: "token", token: "abc123" });
  });

  it("parses SESSION_EXIST", () => {
    expect(
      parseOcpProxyAuthenticateResponse({ softphone_auth_token: "SESSION_EXIST" }),
    ).toEqual({ ok: true, kind: "session_exist" });
  });

  it("rejects invalid shapes", () => {
    expect(parseOcpProxyAuthenticateResponse(null)).toEqual({
      ok: false,
      reason: "invalid_shape",
    });
    expect(parseOcpProxyAuthenticateResponse({ softphone_auth_token: "" })).toEqual({
      ok: false,
      reason: "empty_token",
    });
  });
});
