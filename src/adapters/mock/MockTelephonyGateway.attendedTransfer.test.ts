import { describe, expect, it } from "vitest";
import { MockTelephonyGateway } from "./MockTelephonyGateway.js";
import { createCallId } from "@domain/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

describe("MockTelephonyGateway attendedTransfer", () => {
  it("succeeds when scenario is success", async () => {
    const gateway = new MockTelephonyGateway({ attendedTransferScenario: "success" });
    const result = await gateway.attendedTransfer({
      sourceCallId: createCallId("src-1"),
      consultationCallId: createCallId("consult-1"),
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(true);
    expect(gateway.getAttendedTransferCalls()).toEqual([
      { sourceCallId: "src-1", consultationCallId: "consult-1" },
    ]);
  });

  it("fails when scenario is failure", async () => {
    const gateway = new MockTelephonyGateway({ attendedTransferScenario: "failure" });
    const result = await gateway.attendedTransfer({
      sourceCallId: createCallId("src-2"),
      consultationCallId: createCallId("consult-2"),
      correlationId: createCorrelationId(),
    });

    expect(result.ok).toBe(false);
    expect(gateway.getAttendedTransferCalls()).toHaveLength(0);
  });
});
