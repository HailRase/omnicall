/**
 * Native window show / hide / get-state for SDK gateway (DI-05 / ADR-0009/0013 / WU-02).
 *
 * Main executes BrowserWindow only. Public aggregate revision lives in Application
 * `SdkSessionRevisionCoordinator` (broker path) — this handler must not own a clock.
 *
 * Uses shared bring-to-front (ADR-0013). Rate-limited focus-stealing for
 * `window:show` remains here. Hide is telephony-busy gated; tray recovery via callers.
 */

import type { BrowserWindow } from "electron";

import { bringBrowserWindowToFront } from "@adapters/platform/bringBrowserWindowToFront.js";
import type { ProtocolErrorCode } from "@softomnitel/omnicall-protocol";

export type SdkNativeWindowOpResult =
  | { readonly ok: true; readonly visible: boolean }
  | { readonly ok: false; readonly code: ProtocolErrorCode };

export type SdkWindowHandlerOptions = Readonly<{
  getMainWindow: () => BrowserWindow | null;
  /** Minimum ms between successful show/focus actions (focus-stealing guard). */
  minShowIntervalMs?: number;
  nowMs?: () => number;
  /**
   * True while ringing / connecting / established call context exists.
   * Injected from main telephony-busy mirror (renderer projection → IPC).
   */
  isTelephonyBusy?: () => boolean;
  /** Called after a successful hide so main can ensure tray recovery. */
  onHidden?: () => void;
  /** Called after a successful show so main can drop hide-only tray if unused. */
  onShown?: () => void;
}>;

const DEFAULT_MIN_SHOW_INTERVAL_MS = 1_000;

/**
 * Native-only executor. Revision validate/advance is Application-owned (WU-02).
 */
export class SdkWindowCommandHandler {
  private readonly getMainWindow: () => BrowserWindow | null;
  private readonly minShowIntervalMs: number;
  private readonly nowMs: () => number;
  private readonly isTelephonyBusy: () => boolean;
  private readonly onHidden: (() => void) | undefined;
  private readonly onShown: (() => void) | undefined;
  private lastShowMs = 0;

  constructor(options: SdkWindowHandlerOptions) {
    this.getMainWindow = options.getMainWindow;
    this.minShowIntervalMs =
      options.minShowIntervalMs ?? DEFAULT_MIN_SHOW_INTERVAL_MS;
    this.nowMs = options.nowMs ?? (() => Date.now());
    this.isTelephonyBusy = options.isTelephonyBusy ?? (() => false);
    this.onHidden = options.onHidden;
    this.onShown = options.onShown;
  }

  show(): SdkNativeWindowOpResult {
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
    bringBrowserWindowToFront(window);
    this.lastShowMs = now;
    this.onShown?.();
    return { ok: true, visible: true };
  }

  hide(): SdkNativeWindowOpResult {
    const window = this.resolveWindow();
    if (window === null) {
      return { ok: false, code: "not_ready" };
    }
    if (this.isTelephonyBusy()) {
      return { ok: false, code: "conflict" };
    }
    window.hide();
    this.onHidden?.();
    return { ok: true, visible: false };
  }

  getState(): SdkNativeWindowOpResult {
    const window = this.resolveWindow();
    if (window === null) {
      return { ok: false, code: "not_ready" };
    }
    return { ok: true, visible: window.isVisible() };
  }

  private resolveWindow(): BrowserWindow | null {
    const window = this.getMainWindow();
    if (window === null || window.isDestroyed()) {
      return null;
    }
    return window;
  }
}
