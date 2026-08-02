/**
 * - Purpose: typed native softphone window ops for SDK (no Electron in Application).
 * - Inputs: show / hide / get-state requests from ExternalSdkWindowHandler.
 * - Outputs: visibility success or protocol failure codes (busy/rate/not_ready).
 */

import type { ProtocolErrorCode } from "@softomnitel/omnicall-protocol";

export type SdkNativeWindowSuccess = Readonly<{
  ok: true;
  visible: boolean;
}>;

export type SdkNativeWindowFailure = Readonly<{
  ok: false;
  code: ProtocolErrorCode;
}>;

export type SdkNativeWindowResult =
  | SdkNativeWindowSuccess
  | SdkNativeWindowFailure;

/**
 * Main-owned BrowserWindow executor. Revision authority stays in Application.
 */
export interface SdkNativeWindowPort {
  show(): Promise<SdkNativeWindowResult>;
  hide(): Promise<SdkNativeWindowResult>;
  getState(): Promise<SdkNativeWindowResult>;
}
