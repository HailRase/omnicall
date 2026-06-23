import { describe, expect, it } from "vitest";
import { MockTelephonyGateway } from "./MockTelephonyGateway.js";
import { createCallId, createPhoneNumber } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("MockTelephonyGateway blindTransfer", () => {
  it("maps blind transfer command to success", async () => {
    const gateway = new MockTelephonyGateway({ blindTransferScenario: "success" });
    const result = await gateway.blindTransfer({
      callId: createCallId("call-transfer-1"),
      targetNumber: createPhoneNumber("+12025550200"),
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(gateway.getBlindTransferCalls()).toEqual([
      { callId: "call-transfer-1", targetNumber: "+12025550200" },
    ]);
  });

  it("maps blind transfer failure to normalized platform error", async () => {
    const gateway = new MockTelephonyGateway({ blindTransferScenario: "failure" });
    const result = await gateway.blindTransfer({
      callId: createCallId("call-transfer-2"),
      targetNumber: createPhoneNumber("+12025550201"),
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("operation_failed");
    expect(result.error.message).toContain("Blind transfer failed");
    expect(gateway.getBlindTransferCalls()).toHaveLength(0);
  });
});
