import { describe, expect, it } from "vitest";
import {
  mapActiveCallControlDisabledReason,
  mapActiveCallControlOperationError,
} from "./mapActiveCallControlLabels.js";

describe("mapActiveCallControlLabels", () => {
  it("maps hold_requires_active reason", () => {
    expect(mapActiveCallControlDisabledReason("hold_requires_active")).toBe(
      "Удержание доступно только на активном звонке",
    );
  });

  it("maps transfer_mode_active via transfer helper", () => {
    expect(mapActiveCallControlDisabledReason("transfer_mode_active")).toBe(
      "Режим перевода уже активен",
    );
  });

  it("maps operation error banner text", () => {
    expect(
      mapActiveCallControlOperationError({
        operation: "hold",
        message: "Hold failed for call-1",
      }),
    ).toBe("Удержание: ошибка — Hold failed for call-1");
  });
});
