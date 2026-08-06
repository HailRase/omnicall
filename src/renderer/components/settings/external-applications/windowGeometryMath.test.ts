import { describe, expect, it } from "vitest";
import {
  clampPositionInsideDesktop,
  geometryFromPreviewResize,
  positionFromPreviewDrag,
  previewToReal,
  realToPreview,
  resolveGeometryPreviewScale,
} from "./windowGeometryMath.js";

describe("windowGeometryMath", () => {
  it("scales real pixels with an explicit preview scale (floored)", () => {
    expect(realToPreview(1100, 4)).toBe(275);
    expect(previewToReal(20, 4)).toBe(80);
    expect(realToPreview(1920, 6)).toBe(320);
    expect(realToPreview(100, 3)).toBe(33);
  });

  it("resolves a roomy scale when the stage is wide enough", () => {
    expect(
      resolveGeometryPreviewScale({
        stageContentWidth: 900,
        desktopWidth: 1920,
      }),
    ).toBe(4);
  });

  it("increases scale when the stage is narrow so desktop fits", () => {
    const scale = resolveGeometryPreviewScale({
      stageContentWidth: 320,
      desktopWidth: 1920,
      desktopChromePx: 2,
    });
    // available = 320 - 2 = 318 → required ≈ 6.04
    expect(scale).toBeGreaterThan(4);
    expect(scale).toBeLessThanOrEqual(8);
    expect(Math.floor(1920 / scale)).toBeLessThanOrEqual(318);
  });

  it("clamps drag position so the card stays inside the desktop", () => {
    expect(
      clampPositionInsideDesktop(1900, 1000, 640, 480, { width: 1920, height: 1080 }),
    ).toEqual({ x: 1280, y: 600 });

    expect(
      clampPositionInsideDesktop(-40, -20, 800, 600, { width: 1920, height: 1080 }),
    ).toEqual({ x: 0, y: 0 });
  });

  it("maps preview pointer delta to real origin with scale", () => {
    expect(
      positionFromPreviewDrag(100, 100, 20, 15, 1100, 800, {
        width: 1920,
        height: 1080,
      }, 4),
    ).toEqual({ x: 180, y: 160 });
  });

  it("resizes from the south-east corner with scale", () => {
    expect(
      geometryFromPreviewResize(
        "se",
        { x: 100, y: 100, width: 640, height: 480 },
        10,
        8,
        { width: 1920, height: 1080 },
        4,
      ),
    ).toEqual({ x: 100, y: 100, width: 680, height: 512 });
  });

  it("resizes from the west edge and keeps the right edge fixed", () => {
    expect(
      geometryFromPreviewResize(
        "w",
        { x: 200, y: 100, width: 640, height: 480 },
        10,
        0,
        { width: 1920, height: 1080 },
        4,
      ),
    ).toEqual({ x: 240, y: 100, width: 600, height: 480 });
  });
});
