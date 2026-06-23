import { describe, expect, it } from "vitest";
import {
  mapTransferDisabledReason,
  mapTransferDisabledReasonWithFallback,
} from "./mapTransferDisabledReason.js";

describe("mapTransferDisabledReason", () => {
  it("maps transfer_mode_active", () => {
    expect(mapTransferDisabledReason("transfer_mode_active")).toBe(
      "Transfer mode already active",
    );
  });

  it("maps transfer_in_progress", () => {
    expect(mapTransferDisabledReason("transfer_in_progress")).toBe("Transfer in progress");
  });

  it("maps transfer_not_allowed", () => {
    expect(mapTransferDisabledReason("transfer_not_allowed")).toBe("Transfer not available");
  });

  it("returns null for non-transfer keys", () => {
    expect(mapTransferDisabledReason("hold_requires_active")).toBeNull();
  });

  it("uses fallback for unknown keys", () => {
    expect(mapTransferDisabledReasonWithFallback("unknown_reason")).toBe("Action unavailable");
  });
});
