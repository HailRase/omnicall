/**
 * - Purpose: intercept native close on External Application windows for guest guards.
 * - Inputs: BrowserWindow plus a query function that asks the guest page.
 * - Outputs: controller that can force-close without running the guest guard.
 */

import type { BrowserWindow } from "electron";
import { resolveExternalApplicationCloseAction } from "@shared/ipc/ExternalApplicationCloseGuardContract.js";

export type ExternalApplicationCloseInterceptor = Readonly<{
  markForceClose: () => void;
  dispose: () => void;
}>;

export type AttachExternalApplicationCloseInterceptorOptions = Readonly<{
  browserWindow: BrowserWindow;
  queryGuard: (browserWindow: BrowserWindow) => Promise<boolean>;
  onDenied?: () => void;
}>;

export function attachExternalApplicationCloseInterceptor(
  options: AttachExternalApplicationCloseInterceptorOptions,
): ExternalApplicationCloseInterceptor {
  const state = {
    forceClose: false,
    closeApproved: false,
    closeInFlight: false,
  };

  const onClose = (event: Electron.Event): void => {
    const action = resolveExternalApplicationCloseAction(state);
    if (action === "allow_native_close") {
      return;
    }
    event.preventDefault();
    if (action === "ignore_duplicate") {
      return;
    }

    state.closeInFlight = true;
    void (async () => {
      try {
        const allow = await options.queryGuard(options.browserWindow);
        if (!allow) {
          options.onDenied?.();
          return;
        }
        state.closeApproved = true;
        if (!options.browserWindow.isDestroyed()) {
          options.browserWindow.close();
        }
      } finally {
        state.closeInFlight = false;
      }
    })();
  };

  options.browserWindow.on("close", onClose);

  return {
    markForceClose: (): void => {
      state.forceClose = true;
    },
    dispose: (): void => {
      options.browserWindow.removeListener("close", onClose);
    },
  };
}
