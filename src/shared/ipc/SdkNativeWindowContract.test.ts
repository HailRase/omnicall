/**
 * SDK native window IPC contract parsers.
 */

import { describe, expect, it } from "vitest";

import {
  parseSdkNativeWindowIpcPayload,
  parseSdkNativeWindowIpcResponse,
} from "./SdkNativeWindowContract.js";

describe("SdkNativeWindowContract", () => {
  it("parses valid ops", () => {
    expect(parseSdkNativeWindowIpcPayload({ op: "show" })).toEqual({
      op: "show",
    });
    expect(parseSdkNativeWindowIpcPayload({ op: "hide" })).toEqual({
      op: "hide",
    });
    expect(parseSdkNativeWindowIpcPayload({ op: "get-state" })).toEqual({
      op: "get-state",
    });
  });

  it("rejects unknown ops", () => {
    expect(parseSdkNativeWindowIpcPayload({ op: "focus" })).toBeNull();
    expect(parseSdkNativeWindowIpcPayload({})).toBeNull();
  });

  it("parses success and failure responses", () => {
    expect(
      parseSdkNativeWindowIpcResponse({ ok: true, visible: false }),
    ).toEqual({ ok: true, visible: false });
    expect(
      parseSdkNativeWindowIpcResponse({ ok: false, code: "conflict" }),
    ).toEqual({ ok: false, code: "conflict" });
    expect(
      parseSdkNativeWindowIpcResponse({ ok: false, code: "nope" }),
    ).toBeNull();
  });
});
