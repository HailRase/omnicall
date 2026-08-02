/**
 * - Purpose: renderer→main IPC for SDK native window show/hide/get-state.
 * - Inputs: validated op envelope from preload.
 * - Outputs: visible flag or protocol error code (no revision — Application owns clock).
 */

import {
  PROTOCOL_ERROR_CODES,
  type ProtocolErrorCode,
} from "@softomnitel/omnicall-protocol";

export const SDK_NATIVE_WINDOW_OPS = ["show", "hide", "get-state"] as const;

export type SdkNativeWindowOp = (typeof SDK_NATIVE_WINDOW_OPS)[number];

export type SdkNativeWindowIpcPayload = Readonly<{
  op: SdkNativeWindowOp;
}>;

export type SdkNativeWindowIpcResponse =
  | Readonly<{ ok: true; visible: boolean }>
  | Readonly<{ ok: false; code: ProtocolErrorCode }>;

const PROTOCOL_ERROR_CODE_SET = new Set<string>(PROTOCOL_ERROR_CODES);

export function parseSdkNativeWindowIpcPayload(
  value: unknown,
): SdkNativeWindowIpcPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const op = (value as Record<string, unknown>)["op"];
  if (typeof op !== "string") {
    return null;
  }
  if (!(SDK_NATIVE_WINDOW_OPS as readonly string[]).includes(op)) {
    return null;
  }
  return { op: op as SdkNativeWindowOp };
}

export function parseSdkNativeWindowIpcResponse(
  value: unknown,
): SdkNativeWindowIpcResponse | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (candidate["ok"] === true) {
    if (typeof candidate["visible"] !== "boolean") {
      return null;
    }
    return { ok: true, visible: candidate["visible"] };
  }
  if (candidate["ok"] !== false) {
    return null;
  }
  const code = candidate["code"];
  if (typeof code !== "string" || !PROTOCOL_ERROR_CODE_SET.has(code)) {
    return null;
  }
  return { ok: false, code: code as ProtocolErrorCode };
}
