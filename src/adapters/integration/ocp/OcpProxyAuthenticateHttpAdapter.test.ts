import { describe, expect, it, vi } from "vitest";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import { OcpProxyAuthenticateHttpAdapter } from "./OcpProxyAuthenticateHttpAdapter.js";

describe("OcpProxyAuthenticateHttpAdapter", () => {
  it("returns token from softphone_auth_token", async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ softphone_auth_token: "tok-ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as unknown as typeof fetch;

    const adapter = new OcpProxyAuthenticateHttpAdapter({
      logger: createTestLogger(),
      fetchImpl,
    });

    const result = await adapter.authenticate({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ kind: "token", token: "tok-ok" });
    }
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://ocp.example.com/proxy/authenticate?login=agent1",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Ocp-Proxy-Api-Key": "key-1",
        }),
      }),
    );
  });

  it("maps SESSION_EXIST", async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ softphone_auth_token: "SESSION_EXIST" }), {
          status: 200,
        }),
      ),
    ) as unknown as typeof fetch;

    const adapter = new OcpProxyAuthenticateHttpAdapter({
      logger: createTestLogger(),
      fetchImpl,
    });

    const result = await adapter.authenticate({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ kind: "session_exist" });
    }
  });

  it("fails on HTTP errors", async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response("nope", { status: 401 })),
    ) as unknown as typeof fetch;
    const adapter = new OcpProxyAuthenticateHttpAdapter({
      logger: createTestLogger(),
      fetchImpl,
    });

    const result = await adapter.authenticate({
      domain: "ocp.example.com",
      login: "agent1",
      apiKey: "key-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toEqual(
        expect.objectContaining(
          createPlatformError("operation_failed", "ocp_proxy_authenticate_http_failed"),
        ),
      );
    }
  });
});
