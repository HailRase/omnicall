import { describe, expect, it } from "vitest";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { OperatorStatus } from "@domain/integration/ocp/OperatorStatus.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { ReservePostCallStatusUseCase } from "./ReservePostCallStatusUseCase.js";

describe("ReservePostCallStatusUseCase", () => {
  it("always sends update_post_call_status", async () => {
    const gateway = new MockOcpGateway();
    gateway.connect({ domain: "ocp.example.com", authToken: "token" });
    const useCase = new ReservePostCallStatusUseCase(gateway, createTestLogger());

    const result = await useCase.execute({
      operatorId: 7,
      targetStatus: "break",
      reasonId: 7,
    });

    expect(result.ok).toBe(true);
    expect(gateway.getLastSentCommand()).toEqual({
      kind: "update_post_call_status",
      operatorId: 7,
      reasonId: 7,
      reservedStatus: OperatorStatus.BREAK,
    });
  });
});
