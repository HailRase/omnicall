import { describe, expect, it } from "vitest";
import { deriveOperatorStatusDisabledReason } from "./deriveOperatorStatusDisabledReason.js";
import { initialOperatorStatusProjection } from "./operatorStatusProjection.js";

describe("deriveOperatorStatusDisabledReason", () => {
  it("returns ocp_not_connected when OCP unavailable", () => {
    expect(
      deriveOperatorStatusDisabledReason(
        initialOperatorStatusProjection(),
        "break",
        "online",
      ),
    ).toBe("ocp_not_connected");
  });

  it("returns status_change_in_progress when pending", () => {
    expect(
      deriveOperatorStatusDisabledReason(
        {
          ...initialOperatorStatusProjection(),
          isOcpStatusAvailable: true,
          statusChangeInProgress: true,
        },
        "break",
        "online",
      ),
    ).toBe("status_change_in_progress");
  });

  it("returns dnd_blocks_ready for ready target while DND", () => {
    expect(
      deriveOperatorStatusDisabledReason(
        {
          ...initialOperatorStatusProjection(),
          isOcpStatusAvailable: true,
        },
        "ready",
        "dnd",
      ),
    ).toBe("dnd_blocks_ready");
  });

  it("returns null when action is allowed at projection level", () => {
    expect(
      deriveOperatorStatusDisabledReason(
        {
          ...initialOperatorStatusProjection(),
          isOcpStatusAvailable: true,
        },
        "break",
        "online",
      ),
    ).toBeNull();
  });
});
