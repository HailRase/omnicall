import { describe, expect, it } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { ConnectOcpUseCase } from "./ConnectOcpUseCase.js";

describe("ConnectOcpUseCase", () => {
  it("connects gateway with validated config and logs domain only", async () => {
    const gateway = new MockOcpGateway();
    const logger = createTestLogger();
    const useCase = new ConnectOcpUseCase(gateway, logger);

    const result = await useCase.execute({
      domain: " ocp.example.com ",
      authToken: " secret-token ",
    });

    expect(result.ok).toBe(true);
    expect(gateway.getConnectionState()).toBe("connected");
    expect(logger.entries.some((entry) => entry.message === "connect_ocp_requested")).toBe(
      true,
    );
    const requestLog = logger.entries.find(
      (entry) => entry.message === "connect_ocp_requested",
    );
    expect(requestLog?.context).toMatchObject({
      domain: "ocp.example.com",
      featureId: "F-028",
    });
    expect(JSON.stringify(requestLog?.context ?? {})).not.toContain("secret-token");
  });

  it("rejects empty domain", async () => {
    const gateway = new MockOcpGateway();
    const useCase = new ConnectOcpUseCase(gateway, createTestLogger());

    const result = await useCase.execute({
      domain: " ",
      authToken: "token",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation_failed");
    }
    expect(gateway.getConnectionState()).toBe("disconnected");
  });
});
