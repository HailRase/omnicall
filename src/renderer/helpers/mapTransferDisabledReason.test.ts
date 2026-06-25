import { describe, expect, it } from "vitest";
import {
  mapTransferDisabledReason,
  mapTransferDisabledReasonWithFallback,
} from "./mapTransferDisabledReason.js";

describe("mapTransferDisabledReason", () => {
  it("maps transfer_mode_active", () => {
    expect(mapTransferDisabledReason("transfer_mode_active")).toBe(
      "Режим перевода уже активен",
    );
  });

  it("maps transfer_in_progress", () => {
    expect(mapTransferDisabledReason("transfer_in_progress")).toBe("Перевод выполняется");
  });

  it("maps transfer_not_allowed", () => {
    expect(mapTransferDisabledReason("transfer_not_allowed")).toBe("Перевод недоступен");
  });

  it("returns null for non-transfer keys", () => {
    expect(mapTransferDisabledReason("hold_requires_active")).toBeNull();
  });

  it("uses fallback for unknown keys", () => {
    expect(mapTransferDisabledReasonWithFallback("unknown_reason")).toBe("Действие недоступно");
  });
});
