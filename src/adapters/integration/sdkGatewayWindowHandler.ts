/**
 * Native window show / get-state for SDK gateway (DI-05 / ADR-0009/0013).
 */

import type { BrowserWindow } from "electron";

import type {
  SdkWindowShowResult,
  SdkWindowStateResult,
} from "./sdkGatewayProductSurface.js";

export type SdkWindowHandlerOptions = Readonly<{
  getMainWindow: () => BrowserWindow | null;
  /** Minimum ms between successful show/focus actions (focus-stealing guard). */
  minShowIntervalMs?: number;
  nowMs?: () => number;
}>;

const DEFAULT_MIN_SHOW_INTERVAL_MS = 1_000;

export class SdkWindowCommandHandler {
  private readonly getMainWindow: () => BrowserWindow | null;
  private readonly minShowIntervalMs: number;
  private readonly nowMs: () => number;
  private lastShowMs = 0;
  private revision = 1;

  constructor(options: SdkWindowHandlerOptions) {
    this.getMainWindow = options.getMainWindow;
    this.minShowIntervalMs =
      options.minShowIntervalMs ?? DEFAULT_MIN_SHOW_INTERVAL_MS;
    this.nowMs = options.nowMs ?? (() => Date.now());
  }

  show(): SdkWindowShowResult {
    const window = this.resolveWindow();
    if (window === null) {
      return { ok: false, code: "not_ready" };
    }
    const now = this.nowMs();
    if (
      this.lastShowMs > 0 &&
      now - this.lastShowMs < this.minShowIntervalMs
    ) {
      return { ok: false, code: "rate_limited" };
    }
    if (window.isMinimized()) {
      window.restore();
    }
    if (!window.isVisible()) {
      window.show();
    }
    window.focus();
    this.lastShowMs = now;
    const revision = this.revision;
    this.revision += 1;
    return { ok: true, revision, visible: true };
  }

  getState(): SdkWindowStateResult {
    const window = this.resolveWindow();
    if (window === null) {
      return { ok: false, code: "not_ready" };
    }
    const revision = this.revision;
    return { ok: true, visible: window.isVisible(), revision };
  }

  private resolveWindow(): BrowserWindow | null {
    const window = this.getMainWindow();
    if (window === null || window.isDestroyed()) {
      return null;
    }
    return window;
  }
}
