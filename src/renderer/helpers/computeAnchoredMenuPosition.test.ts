import { describe, expect, it } from "vitest";
import { computeAnchoredMenuPosition } from "./computeAnchoredMenuPosition.js";

describe("computeAnchoredMenuPosition", () => {
  const menuRect = { top: 0, left: 0, right: 160, bottom: 120, width: 160, height: 120 };

  it("places menu below anchor by default", () => {
    const anchorRect = { top: 40, left: 20, right: 56, bottom: 76, width: 36, height: 36 };

    expect(computeAnchoredMenuPosition(anchorRect, menuRect, 400, 300)).toEqual({
      top: 80,
      left: 20,
    });
  });

  it("flips above anchor when bottom overflows", () => {
    const anchorRect = { top: 250, left: 20, right: 56, bottom: 286, width: 36, height: 36 };

    expect(computeAnchoredMenuPosition(anchorRect, menuRect, 400, 300)).toEqual({
      top: 126,
      left: 20,
    });
  });

  it("aligns to anchor end when right overflows", () => {
    const anchorRect = { top: 40, left: 360, right: 396, bottom: 76, width: 36, height: 36 };

    expect(computeAnchoredMenuPosition(anchorRect, menuRect, 400, 300)).toEqual({
      top: 80,
      left: 232,
    });
  });
});
