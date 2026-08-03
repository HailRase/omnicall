import { describe, expect, it } from "vitest";
import { clampExternalApplicationWindowBounds } from "./clampExternalApplicationWindowBounds.js";

const workArea = { x: 0, y: 0, width: 1920, height: 1080 };

describe("clampExternalApplicationWindowBounds", () => {
  it("keeps on-screen geometry unchanged", () => {
    expect(
      clampExternalApplicationWindowBounds(
        { x: 100, y: 100, width: 1100, height: 800 },
        workArea,
      ),
    ).toEqual({ x: 100, y: 100, width: 1100, height: 800 });
  });

  it("pulls fully off-screen windows partially into the work area", () => {
    expect(
      clampExternalApplicationWindowBounds(
        { x: 5000, y: -2000, width: 400, height: 300 },
        workArea,
      ),
    ).toEqual({ x: 1856, y: -236, width: 400, height: 300 });
  });

  it("caps size to the work area", () => {
    expect(
      clampExternalApplicationWindowBounds(
        { x: 10, y: 10, width: 4000, height: 3000 },
        workArea,
      ),
    ).toEqual({ x: 10, y: 10, width: 1920, height: 1080 });
  });
});
