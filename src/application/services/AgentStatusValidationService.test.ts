import { describe, expect, it } from "vitest";
import { AgentStatusValidationService } from "./AgentStatusValidationService.js";

describe("AgentStatusValidationService", () => {
  const service = new AgentStatusValidationService();

  it("delegates transition validation to domain rules", () => {
    const result = service.validateTransition("ready", "break", {
      phoneStatus: "online",
      breakReasonRequired: false,
      reason: null,
    });

    expect(result).toEqual({ ok: true, targetStatus: "break" });
  });
});
