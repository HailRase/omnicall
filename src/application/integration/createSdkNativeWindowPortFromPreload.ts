/**
 * - Purpose: bind SdkNativeWindowPort to preload IPC (renderer Application).
 * - Inputs: softphone.invokeSdkNativeWindow ops.
 * - Outputs: typed native results without revision (coordinator owns clock).
 */

import type {
  SdkNativeWindowPort,
  SdkNativeWindowResult,
} from "@ports/integration/SdkNativeWindowPort.js";
import type { SdkNativeWindowIpcPayload } from "@shared/ipc/SdkNativeWindowContract.js";

async function invokeNative(
  op: SdkNativeWindowIpcPayload["op"],
): Promise<SdkNativeWindowResult> {
  const softphone = window.softphone;
  if (softphone === undefined) {
    return { ok: false, code: "not_ready" };
  }
  const response = await softphone.invokeSdkNativeWindow({ op });
  if (!response.ok) {
    return { ok: false, code: response.code };
  }
  return { ok: true, visible: response.visible };
}

export function createSdkNativeWindowPortFromPreload(): SdkNativeWindowPort {
  return {
    show: () => invokeNative("show"),
    hide: () => invokeNative("hide"),
    getState: () => invokeNative("get-state"),
  };
}
