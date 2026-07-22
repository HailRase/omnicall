/**
 * Main-process attention raises for softphone shell (ADR-0013).
 * Telephony / SDK consent use dedupe keys; SDK window:show keeps its own rate limit.
 */

import type { BrowserWindow } from "electron";

import { bringBrowserWindowToFront } from "@adapters/platform/bringBrowserWindowToFront.js";
import type { ShellWindowRaiseReason } from "@shared/ipc/ShellWindowRaiseContract.js";

export type ShellWindowAttentionRaiseInput = Readonly<{
  reason: ShellWindowRaiseReason | "sdk_window_show";
  dedupeKey?: string;
}>;

export type ShellWindowAttentionRaiseResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; code: "not_ready" | "duplicate" }>;

export type ShellWindowAttentionControllerOptions = Readonly<{
  getMainWindow: () => BrowserWindow | null;
  /**
   * Max tracked dedupe keys (FIFO eviction). Prevents unbounded growth across
   * long-lived sessions with many calls/pairings.
   */
  maxDedupeKeys?: number;
}>;

const DEFAULT_MAX_DEDUPE_KEYS = 64;

export class ShellWindowAttentionController {
  private readonly getMainWindow: () => BrowserWindow | null;
  private readonly maxDedupeKeys: number;
  private readonly seenKeys = new Set<string>();
  private readonly keyOrder: string[] = [];

  constructor(options: ShellWindowAttentionControllerOptions) {
    this.getMainWindow = options.getMainWindow;
    this.maxDedupeKeys = options.maxDedupeKeys ?? DEFAULT_MAX_DEDUPE_KEYS;
  }

  raise(input: ShellWindowAttentionRaiseInput): ShellWindowAttentionRaiseResult {
    const window = this.resolveWindow();
    if (window === null) {
      return { ok: false, code: "not_ready" };
    }
    if (input.dedupeKey !== undefined) {
      const key = `${input.reason}:${input.dedupeKey}`;
      if (this.seenKeys.has(key)) {
        return { ok: false, code: "duplicate" };
      }
      this.rememberKey(key);
    }
    bringBrowserWindowToFront(window);
    return { ok: true };
  }

  private rememberKey(key: string): void {
    this.seenKeys.add(key);
    this.keyOrder.push(key);
    while (this.keyOrder.length > this.maxDedupeKeys) {
      const oldest = this.keyOrder.shift();
      if (oldest !== undefined) {
        this.seenKeys.delete(oldest);
      }
    }
  }

  private resolveWindow(): BrowserWindow | null {
    const window = this.getMainWindow();
    if (window === null || window.isDestroyed()) {
      return null;
    }
    return window;
  }
}
