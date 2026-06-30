import { describe, expect, it } from "vitest";
import { deriveTransferTargetCandidates } from "./deriveTransferTargetCandidates.js";
import type { CallLine } from "./multiLineCallProjection.js";

function createLine(
  overrides: Partial<CallLine> & Pick<CallLine, "callId" | "state">,
): CallLine {
  return {
    callId: overrides.callId,
    role: overrides.role ?? "primary",
    state: overrides.state,
    muted: overrides.muted ?? false,
    displayLabel: overrides.displayLabel ?? "+12025550100",
    remoteNumber: overrides.remoteNumber ?? "+12025550100",
    activeSinceMs: overrides.activeSinceMs ?? null,
    isRemoteHold: overrides.isRemoteHold ?? false,
    dtmfHistory: overrides.dtmfHistory ?? "",
    lastDtmfTone: overrides.lastDtmfTone ?? null,
  };
}

describe("deriveTransferTargetCandidates", () => {
  it("returns other established lines with dialable remote numbers", () => {
    const candidates = deriveTransferTargetCandidates({
      sourceCallId: "call-b",
      lines: [
        createLine({
          callId: "call-a",
          state: "Held",
          role: "primary",
          displayLabel: "Мария",
          remoteNumber: "+12025550101",
        }),
        createLine({
          callId: "call-b",
          state: "Held",
          role: "source",
          remoteNumber: "+12025550102",
        }),
      ],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.callId).toBe("call-a");
    expect(candidates[0]?.remoteNumber).toBe("+12025550101");
  });

  it("excludes consultation leg and non-established states", () => {
    const candidates = deriveTransferTargetCandidates({
      sourceCallId: "call-source",
      lines: [
        createLine({
          callId: "call-source",
          state: "Held",
          role: "source",
          remoteNumber: "+12025550101",
        }),
        createLine({
          callId: "call-consult",
          state: "Active",
          role: "consultation",
          remoteNumber: "+12025550102",
        }),
        createLine({
          callId: "call-ringing",
          state: "Ringing",
          remoteNumber: "+12025550103",
        }),
        createLine({
          callId: "call-invalid",
          state: "Active",
          remoteNumber: "",
        }),
      ],
    });

    expect(candidates).toHaveLength(0);
  });
});
