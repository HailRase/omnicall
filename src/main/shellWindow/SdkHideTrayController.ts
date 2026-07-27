/**
 * Minimal tray used only while the softphone is SDK-hidden (ADR-0013 recovery).
 * Not full minimize-to-tray product UX — Show restores via bring-to-front.
 */

import { Menu, Tray, nativeImage, type BrowserWindow, type NativeImage } from "electron";
import { join } from "node:path";

import { bringBrowserWindowToFront } from "@adapters/platform/bringBrowserWindowToFront.js";

export type SdkHideTrayControllerOptions = Readonly<{
  getMainWindow: () => BrowserWindow | null;
  /** Optional icon path override (tests). */
  resolveIconPath?: () => string | null;
  log?: (
    event: string,
    fields: Readonly<Record<string, string | number | boolean>>,
  ) => void;
}>;

function defaultIconPath(): string | null {
  try {
    return join(process.cwd(), "build", "icons", "16x16.png");
  } catch {
    return null;
  }
}

export class SdkHideTrayController {
  private readonly getMainWindow: () => BrowserWindow | null;
  private readonly resolveIconPath: () => string | null;
  private readonly log:
    | ((
        event: string,
        fields: Readonly<Record<string, string | number | boolean>>,
      ) => void)
    | undefined;
  private tray: Tray | null = null;

  constructor(options: SdkHideTrayControllerOptions) {
    this.getMainWindow = options.getMainWindow;
    this.resolveIconPath = options.resolveIconPath ?? defaultIconPath;
    this.log = options.log;
  }

  ensureVisible(): void {
    if (this.tray !== null) {
      return;
    }
    const image = this.loadIcon();
    if (image === null) {
      this.log?.("sdk_hide_tray_icon_missing", { result: "skipped" });
      return;
    }
    const tray = new Tray(image);
    tray.setToolTip("Axatalk");
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Show Axatalk",
          click: () => {
            this.restoreMainWindow();
          },
        },
      ]),
    );
    tray.on("click", () => {
      this.restoreMainWindow();
    });
    this.tray = tray;
    this.log?.("sdk_hide_tray_shown", { result: "ok" });
  }

  dispose(): void {
    if (this.tray === null) {
      return;
    }
    this.tray.destroy();
    this.tray = null;
    this.log?.("sdk_hide_tray_disposed", { result: "ok" });
  }

  isActive(): boolean {
    return this.tray !== null;
  }

  private restoreMainWindow(): void {
    const window = this.getMainWindow();
    if (window === null || window.isDestroyed()) {
      return;
    }
    bringBrowserWindowToFront(window);
    this.dispose();
  }

  private loadIcon(): NativeImage | null {
    const path = this.resolveIconPath();
    if (path === null) {
      return null;
    }
    const image = nativeImage.createFromPath(path);
    if (image.isEmpty()) {
      return null;
    }
    return image;
  }
}
