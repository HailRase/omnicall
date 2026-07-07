import type { WebContents } from "electron";
import { isMainProcessDevMode } from "./resolveMainProcessDevMode.js";

export type WebContentsShortcutInput = Readonly<{
  type: string;
  key: string;
  control?: boolean;
  shift?: boolean;
}>;

export type InstallDeveloperWebContentsShortcutsOptions = Readonly<{
  isDevMode?: boolean;
  platform?: NodeJS.Platform;
}>;

/**
 * - Purpose: detect DevTools toggle shortcuts for Windows/Linux developer builds.
 * - Inputs: normalized webContents keyboard input payload.
 * - Outputs: true when F12 or Ctrl+Shift+I should toggle DevTools.
 */
export function isDeveloperWebContentsShortcut(input: WebContentsShortcutInput): boolean {
  if (input.type !== "keyDown") {
    return false;
  }

  if (input.key === "F12") {
    return true;
  }

  return (
    input.control === true &&
    input.shift === true &&
    input.key.toLowerCase() === "i"
  );
}

/**
 * - Purpose: wire DevTools keyboard shortcuts for unpackaged non-macOS builds.
 * - Inputs: BrowserWindow webContents; optional dev-mode and platform overrides.
 * - Outputs: registers before-input listener or no-ops in production/macOS.
 */
export function installDeveloperWebContentsShortcuts(
  webContents: WebContents,
  options: InstallDeveloperWebContentsShortcutsOptions = {},
): void {
  const isDevMode = options.isDevMode ?? isMainProcessDevMode();
  const platform = options.platform ?? process.platform;

  if (!isDevMode || platform === "darwin") {
    return;
  }

  webContents.on("before-input-event", (event, input) => {
    if (!isDeveloperWebContentsShortcut(input)) {
      return;
    }

    if (webContents.isDevToolsOpened()) {
      webContents.closeDevTools();
    } else {
      webContents.openDevTools({ mode: "detach" });
    }

    event.preventDefault();
  });
}
