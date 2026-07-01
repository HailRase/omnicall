import { app, nativeImage, type BrowserWindow } from "electron";
import type { Logger } from "@ports/index.js";
import type { AppIconTheme } from "./resolveAppIconPath.js";
import { resolveAppIconPath } from "./resolveAppIconPath.js";

/**
 * - Purpose: apply a theme-aware native icon to window and macOS dock.
 * - Inputs: BrowserWindow reference, icon theme, and integration logger.
 * - Outputs: updated icon in shell surfaces or logged warning on fallback.
 */
export function applyAppIcon(
  mainWindow: BrowserWindow,
  theme: AppIconTheme,
  logger: Logger,
): void {
  const iconPath = resolveAppIconPath(theme);
  if (iconPath === null) {
    logger.warn("platform_icon_path_missing", {
      operation: "platform_apply_icon",
      result: "missing_icon",
      theme,
    });
    return;
  }

  if (process.platform === "darwin") {
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) {
      logger.warn("platform_icon_load_failed", {
        operation: "platform_apply_icon",
        result: "invalid_image",
        theme,
      });
      return;
    }
    app.dock?.setIcon(image);
    return;
  }

  mainWindow.setIcon(iconPath);
}
