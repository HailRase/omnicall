import { describe, expect, it } from "vitest";
import {
  mapOperatorStatusDisabledReason,
  mapOperatorStatusDisabledReasonWithFallback,
} from "./mapOperatorStatusDisabledReason.js";

describe("mapOperatorStatusDisabledReason", () => {
  it("maps known disabled reason keys", () => {
    expect(mapOperatorStatusDisabledReason("ocp_not_connected")).toBe(
      "Operator platform unavailable",
    );
    expect(mapOperatorStatusDisabledReason("invalid_transition")).toBe(
      "Status change not allowed",
    );
    expect(mapOperatorStatusDisabledReason("dnd_blocks_ready")).toBe(
      "Ready unavailable while DND",
    );
    expect(mapOperatorStatusDisabledReason("status_change_in_progress")).toBe(
      "Status change in progress",
    );
    expect(mapOperatorStatusDisabledReason("break_reason_required")).toBe(
      "Break reason required",
    );
  });

  it("returns null for unknown keys", () => {
    expect(mapOperatorStatusDisabledReason("unknown_reason")).toBeNull();
  });

  it("uses fallback for unknown keys via withFallback helper", () => {
    expect(mapOperatorStatusDisabledReasonWithFallback("unknown_reason")).toBe(
      "Action unavailable",
    );
  });
});
