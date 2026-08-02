import { describe, expect, it } from "vitest";
import {
  parseShellWindowAlwaysOnTopChangedPayload,
  parseShellWindowAlwaysOnTopPayload,
  parseShellWindowAlwaysOnTopStateResponse,
} from "./ShellWindowAlwaysOnTopContract.js";

describe("ShellWindowAlwaysOnTopContract", () => {
  it("parses set payload", () => {
    expect(parseShellWindowAlwaysOnTopPayload({ alwaysOnTop: true })).toEqual({
      alwaysOnTop: true,
    });
    expect(parseShellWindowAlwaysOnTopPayload({ alwaysOnTop: "yes" })).toBeNull();
  });

  it("parses state response", () => {
    expect(
      parseShellWindowAlwaysOnTopStateResponse({ ok: true, alwaysOnTop: false }),
    ).toEqual({ ok: true, alwaysOnTop: false });
    expect(parseShellWindowAlwaysOnTopStateResponse({ ok: false })).toEqual({
      ok: false,
    });
    expect(parseShellWindowAlwaysOnTopStateResponse({ ok: true })).toBeNull();
  });

  it("parses changed payload", () => {
    expect(
      parseShellWindowAlwaysOnTopChangedPayload({ alwaysOnTop: true }),
    ).toEqual({ alwaysOnTop: true });
    expect(parseShellWindowAlwaysOnTopChangedPayload({})).toBeNull();
  });
});
