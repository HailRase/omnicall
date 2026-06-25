import { describe, expect, it } from "vitest";
import {
  mapActiveCallControlDisabledReason,
  mapActiveCallControlOperationError,
} from "./mapActiveCallControlLabels.js";

describe("mapActiveCallControlLabels", () => {
  it("maps hold_requires_active reason", () => {
    expect(mapActiveCallControlDisabledReason("hold_requires_active")).toBe(
      "Hold requires active call",
    );
  });

  it("maps transfer_mode_active via transfer helper", () => {
    expect(mapActiveCallControlDisabledReason("transfer_mode_active")).toBe(
      "Transfer mode already active",
    );
  });

  it("maps operation error banner text", () => {
    expect(
      mapActiveCallControlOperationError({
        operation: "hold",
        message: "Hold failed for call-1",
      }),
    ).toBe("Hold failed: Hold failed for call-1");
  });
});
