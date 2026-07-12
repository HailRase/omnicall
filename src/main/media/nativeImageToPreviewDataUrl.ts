/**
 * - Purpose: map Electron NativeImage to IPC-safe PNG data URL for picker previews (F-027).
 * - Inputs: NativeImage from desktopCapturer thumbnail or appIcon.
 * - Outputs: data URL string or null when empty/corrupt.
 */

import type { NativeImage } from "electron";

/** Reject truncated/empty PNG payloads from Electron thumbnail bugs. */
const MIN_PNG_BYTE_LENGTH = 64;

/**
 * - Purpose: encode NativeImage as PNG data URL for renderer `<img src>`.
 * - Inputs: Electron NativeImage.
 * - Outputs: `data:image/png;base64,...` or null.
 */
export function nativeImageToPreviewDataUrl(image: NativeImage): string | null {
  try {
    if (image.isEmpty()) {
      return null;
    }
    const size = image.getSize();
    if (size.width < 2 || size.height < 2) {
      return null;
    }
    // toPNG() is the supported binary path for shipping NativeImage over IPC as a string.
    const png = image.toPNG();
    if (!Buffer.isBuffer(png) || png.byteLength < MIN_PNG_BYTE_LENGTH) {
      return null;
    }
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}
