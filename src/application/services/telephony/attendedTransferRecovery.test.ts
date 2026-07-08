import { describe, expect, it } from "vitest";
import { createCallId, createOutgoingCall, createPhoneNumber } from "@domain/index.js";
import {
  markCallLegEndedAfterTransfer,
  markCallTransferCompleted,
} from "./attendedTransferRecovery.js";

describe("attendedTransferRecovery", () => {
  const callId = createCallId("leg-1");
  const phoneNumber = createPhoneNumber("+12025550100");

  it("ends consultation leg from Active via ended transition", () => {
    const consultation = { ...createOutgoingCall(callId, phoneNumber), state: "Active" as const };
    const ended = markCallLegEndedAfterTransfer(consultation);
    expect(ended.state).toBe("Ended");
  });

  it("ends source leg from Transferring via transfer_completed", () => {
    const source = {
      ...createOutgoingCall(callId, phoneNumber),
      state: "Transferring" as const,
    };
    const ended = markCallTransferCompleted(source);
    expect(ended.state).toBe("Ended");
  });
});
