/**
 * Native bring-to-front for BrowserWindow (ADR-0013 local focus policy).
 * Shared by SDK window:show, shell raise IPC, second-instance, and SDK consent.
 * Never leaves the window permanently always-on-top.
 */

import type { BrowserWindow } from "electron";

export function bringBrowserWindowToFront(window: BrowserWindow): void {
  if (window.isMinimized()) {
    window.restore();
  }
  // Always show: visible-but-occluded windows need show+focus on Windows.
  window.show();
  window.focus();
  window.moveTop();
  pulseTemporaryAlwaysOnTop(window);
}

function pulseTemporaryAlwaysOnTop(window: BrowserWindow): void {
  const wasAlwaysOnTop = window.isAlwaysOnTop();
  window.setAlwaysOnTop(true);
  window.setAlwaysOnTop(wasAlwaysOnTop);
}
