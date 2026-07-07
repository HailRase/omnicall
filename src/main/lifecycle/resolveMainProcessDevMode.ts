import { app } from "electron";

/**
 * - Purpose: resolve developer mode from the packaged runtime flag.
 * - Inputs: Electron `app.isPackaged` value.
 * - Outputs: true for unpackaged dev/preview runs; false for packaged production builds.
 */
export function resolveMainProcessDevMode(isPackaged: boolean): boolean {
  return !isPackaged;
}

/**
 * - Purpose: detect whether the main process runs in developer mode.
 * - Inputs: Electron `app.isPackaged` runtime flag.
 * - Outputs: true for unpackaged dev/preview runs; false for packaged production builds.
 */
export function isMainProcessDevMode(): boolean {
  return resolveMainProcessDevMode(app.isPackaged);
}
