import { describe, expect, it } from "vitest";
import {
  mapOperatorStatusDisabledReason,
  mapOperatorStatusDisabledReasonWithFallback,
} from "./mapOperatorStatusDisabledReason.js";

describe("mapOperatorStatusDisabledReason", () => {
  it("maps known disabled reason keys", () => {
    expect(mapOperatorStatusDisabledReason("ocp_not_connected")).toBe(
      "Платформа оператора недоступна",
    );
    expect(mapOperatorStatusDisabledReason("invalid_transition")).toBe(
      "Смена статуса недоступна",
    );
    expect(mapOperatorStatusDisabledReason("dnd_blocks_ready")).toBe(
      "«Готов» недоступен в режиме «Не беспокоить»",
    );
    expect(mapOperatorStatusDisabledReason("status_change_in_progress")).toBe(
      "Смена статуса выполняется",
    );
    expect(mapOperatorStatusDisabledReason("break_reason_required")).toBe(
      "Требуется причина перерыва",
    );
  });

  it("returns null for unknown keys", () => {
    expect(mapOperatorStatusDisabledReason("unknown_reason")).toBeNull();
  });

  it("uses fallback for unknown keys via withFallback helper", () => {
    expect(mapOperatorStatusDisabledReasonWithFallback("unknown_reason")).toBe(
      "Действие недоступно",
    );
  });
});
