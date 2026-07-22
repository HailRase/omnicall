/**
 * Contract tests for shell window raise IPC parsers.
 */

import { describe, expect, it } from "vitest";
import {
  parseShellOperatorAttentionPayload,
  parseShellWindowRaisePayload,
  parseShellWindowRaiseResponse,
} from "./ShellWindowRaiseContract.js";

describe("ShellWindowRaiseContract", () => {
  it("parses raise payloads", () => {
    expect(
      parseShellWindowRaisePayload({
        reason: "incoming_call",
        dedupeKey: "c1",
      }),
    ).toEqual({ reason: "incoming_call", dedupeKey: "c1" });
    expect(parseShellWindowRaisePayload({ reason: "nope" })).toBeNull();
  });

  it("parses responses and attention events", () => {
    expect(parseShellWindowRaiseResponse({ ok: true })).toEqual({ ok: true });
    expect(
      parseShellWindowRaiseResponse({ ok: false, reason: "duplicate" }),
    ).toEqual({ ok: false, reason: "duplicate" });
    expect(parseShellOperatorAttentionPayload({ kind: "sdk_pairing" })).toEqual({
      kind: "sdk_pairing",
    });
    expect(parseShellOperatorAttentionPayload({ kind: "other" })).toBeNull();
  });
});
