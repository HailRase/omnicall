import { describe, expect, it } from "vitest";
import type { NativeImage } from "electron";
import { nativeImageToPreviewDataUrl } from "./nativeImageToPreviewDataUrl.js";

function createNativeImageMock(
  input: Readonly<{
    empty: boolean;
    width: number;
    height: number;
    png: Buffer;
  }>,
): NativeImage {
  return {
    isEmpty: () => input.empty,
    getSize: () => ({ width: input.width, height: input.height }),
    toPNG: () => input.png,
  } as unknown as NativeImage;
}

describe("nativeImageToPreviewDataUrl", () => {
  it("returns null for empty or tiny images", () => {
    expect(
      nativeImageToPreviewDataUrl(
        createNativeImageMock({
          empty: true,
          width: 0,
          height: 0,
          png: Buffer.alloc(128),
        }),
      ),
    ).toBeNull();
    expect(
      nativeImageToPreviewDataUrl(
        createNativeImageMock({
          empty: false,
          width: 1,
          height: 1,
          png: Buffer.alloc(128),
        }),
      ),
    ).toBeNull();
  });

  it("returns null for tiny PNG buffers", () => {
    expect(
      nativeImageToPreviewDataUrl(
        createNativeImageMock({
          empty: false,
          width: 320,
          height: 180,
          png: Buffer.from([1, 2, 3]),
        }),
      ),
    ).toBeNull();
  });

  it("returns PNG data URL for valid preview images", () => {
    const png = Buffer.alloc(128, 7);
    expect(
      nativeImageToPreviewDataUrl(
        createNativeImageMock({
          empty: false,
          width: 320,
          height: 180,
          png,
        }),
      ),
    ).toBe(`data:image/png;base64,${png.toString("base64")}`);
  });

  it("returns null when toPNG throws", () => {
    const image = {
      isEmpty: () => false,
      getSize: () => ({ width: 100, height: 100 }),
      toPNG: () => {
        throw new Error("boom");
      },
    } as unknown as NativeImage;
    expect(nativeImageToPreviewDataUrl(image)).toBeNull();
  });
});
