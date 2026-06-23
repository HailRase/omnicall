import { describe, expect, it } from "vitest";
import { createBreakReason } from "@domain/index.js";
import { SelectRejectReasonUseCase } from "./SelectRejectReasonUseCase.js";

describe("SelectRejectReasonUseCase", () => {
  it("returns validation error for disallowed reason", () => {
    const useCase = new SelectRejectReasonUseCase();
    const result = useCase.execute({
      reason: "meeting",
      allowedReasons: [createBreakReason("break")],
    });
    expect(result.ok).toBe(false);
  });

  it("returns selected reason for allowed value", () => {
    const useCase = new SelectRejectReasonUseCase();
    const result = useCase.execute({
      reason: "break",
      allowedReasons: [createBreakReason("break")],
    });
    expect(result.ok).toBe(true);
  });
});
