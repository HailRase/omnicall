import { describe, expect, it } from "vitest";
import { evaluateBlindTransferEligibility } from "./TransferEligibility.js";

describe("TransferEligibility", () => {
  it("allows blind transfer from Active with valid target", () => {
    const result = evaluateBlindTransferEligibility({
      callState: "Active",
      targetNumber: "+12025550199",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.targetNumber).toBe("+12025550199");
  });

  it("allows blind transfer from Held with valid target", () => {
    const result = evaluateBlindTransferEligibility({
      callState: "Held",
      targetNumber: "+12025550198",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects when call is missing", () => {
    const result = evaluateBlindTransferEligibility({
      callState: null,
      targetNumber: "+12025550197",
    });
    expect(result).toEqual({ ok: false, reason: "no_active_call" });
  });

  it("rejects transfer from Ringing state", () => {
    const result = evaluateBlindTransferEligibility({
      callState: "Ringing",
      targetNumber: "+12025550196",
    });
    expect(result).toEqual({ ok: false, reason: "transfer_not_allowed" });
  });

  it("allows blind transfer with single-digit extension", () => {
    const result = evaluateBlindTransferEligibility({
      callState: "Active",
      targetNumber: "5",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.targetNumber).toBe("5");
  });

  it("rejects invalid target number", () => {
    const result = evaluateBlindTransferEligibility({
      callState: "Active",
      targetNumber: "abc",
    });
    expect(result).toEqual({ ok: false, reason: "invalid_target" });
  });

  it("rejects transfer when already transferring", () => {
    const result = evaluateBlindTransferEligibility({
      callState: "Transferring",
      targetNumber: "+12025550195",
    });
    expect(result).toEqual({ ok: false, reason: "transfer_not_allowed" });
  });
});
