import { describe, expect, it } from "vitest";

import { createOcpConnectionConfig } from "./OcpConnectionConfig.js";

describe("OcpConnectionConfig", () => {
  it("creates config when domain and token are non-empty", () => {
    const result = createOcpConnectionConfig({
      domain: "  ocp.example.com  ",
      authToken: "  secret-token  ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        domain: "ocp.example.com",
        authToken: "secret-token",
      },
    });
  });

  it("rejects empty domain", () => {
    expect(createOcpConnectionConfig({ domain: "   ", authToken: "token" })).toEqual({
      ok: false,
      error: "domain_required",
    });
  });

  it("rejects empty auth token", () => {
    expect(createOcpConnectionConfig({ domain: "ocp.example.com", authToken: "" })).toEqual({
      ok: false,
      error: "auth_token_required",
    });
  });
});
