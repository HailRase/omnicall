import { describe, expect, it } from "vitest";
import {
  BENIGN_TRANSFER_FAILURE_REASONS,
  isBenignTransferFailureReason,
} from "./transferFailureReasons.js";

describe("transferFailureReasons", () => {
  it("treats transfer_cancelled as benign", () => {
    expect(BENIGN_TRANSFER_FAILURE_REASONS.has("transfer_cancelled")).toBe(true);
    expect(isBenignTransferFailureReason("transfer_cancelled")).toBe(true);
  });

  it("does not treat real failure reasons as benign", () => {
    expect(isBenignTransferFailureReason("REFER rejected")).toBe(false);
    expect(isBenignTransferFailureReason("busy")).toBe(false);
    expect(isBenignTransferFailureReason("consultation_start_requires_dialing")).toBe(false);
  });
});
