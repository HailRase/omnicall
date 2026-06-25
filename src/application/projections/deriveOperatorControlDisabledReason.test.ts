import { describe, expect, it } from "vitest";
import {
  buildOperatorBreakReasonContext,
  deriveOperatorControlDisabledReason,
} from "./deriveOperatorControlDisabledReason.js";
import { initialOperatorStatusProjection } from "./operatorStatusProjection.js";

describe("deriveOperatorControlDisabledReason", () => {
  it("returns invalid_transition when current status cannot reach target", () => {
    expect(
      deriveOperatorControlDisabledReason(
        {
          ...initialOperatorStatusProjection(),
          isOcpStatusAvailable: true,
          currentStatus: "ready",
        },
        "ready",
        "online",
      ),
    ).toBe("invalid_transition");
  });

  it("returns null when transition is allowed", () => {
    expect(
      deriveOperatorControlDisabledReason(
        {
          ...initialOperatorStatusProjection(),
          isOcpStatusAvailable: true,
          currentStatus: "ready",
        },
        "break",
        "online",
      ),
    ).toBeNull();
  });

  it("returns break_reason_required when break lacks reason", () => {
    expect(
      deriveOperatorControlDisabledReason(
        {
          ...initialOperatorStatusProjection(),
          isOcpStatusAvailable: true,
          currentStatus: "ready",
          allowedBreakReasonsCount: 2,
        },
        "break",
        "online",
        buildOperatorBreakReasonContext("break", true, null),
      ),
    ).toBe("break_reason_required");
  });
});
