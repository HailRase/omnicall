import { describe, expect, it } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { DisconnectOcpUseCase } from "./DisconnectOcpUseCase.js";

describe("DisconnectOcpUseCase", () => {
  it("disconnects gateway with logout reason", async () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    const useCase = new DisconnectOcpUseCase(gateway, createTestLogger());

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    expect(gateway.getConnectionState()).toBe("disconnected");
  });
});
