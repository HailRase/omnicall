import { describe, expect, it } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { MockOperatorPlatformGateway } from "./MockOperatorPlatformGateway.js";

describe("MockOperatorPlatformGateway.changeAgentStatus", () => {
  it("returns succeeded status echoing target", async () => {
    const gateway = new MockOperatorPlatformGateway();
    const correlationId = createCorrelationId();

    const result = await gateway.changeAgentStatus({
      targetStatus: "break",
      reason: null,
      correlationId,
    });

    expect(result).toEqual({ status: "succeeded", currentStatus: "break" });
  });

  it("returns rejected failure scenario", async () => {
    const gateway = new MockOperatorPlatformGateway({
      statusChangeScenario: "rejected",
    });
    const correlationId = createCorrelationId();

    const result = await gateway.changeAgentStatus({
      targetStatus: "break",
      reason: null,
      correlationId,
    });

    expect(result).toEqual({
      status: "failed",
      reason: "gateway_failed",
      message: "OCP rejected status change",
    });
  });

  it("returns network_error failure scenario", async () => {
    const gateway = new MockOperatorPlatformGateway({
      statusChangeScenario: "network_error",
    });
    const correlationId = createCorrelationId();

    const result = await gateway.changeAgentStatus({
      targetStatus: "ready",
      reason: null,
      correlationId,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toBe("network_error");
    }
  });

  it("returns initial agent status from getAgentStatus", async () => {
    const gateway = new MockOperatorPlatformGateway({
      initialAgentStatus: "break",
    });
    const correlationId = createCorrelationId();

    await expect(gateway.getAgentStatus({ correlationId })).resolves.toBe("break");
  });

  it("honors delayMs for status change", async () => {
    const gateway = new MockOperatorPlatformGateway({ delayMs: 30 });
    const correlationId = createCorrelationId();
    const startedAt = Date.now();

    await gateway.changeAgentStatus({
      targetStatus: "break",
      reason: null,
      correlationId,
    });

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(25);
  });
});
