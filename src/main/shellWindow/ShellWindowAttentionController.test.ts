/**
 * Unit tests for ShellWindowAttentionController (no Electron runtime).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { ShellWindowAttentionController } from "./ShellWindowAttentionController.js";

vi.mock("@adapters/platform/bringBrowserWindowToFront.js", () => ({
  bringBrowserWindowToFront: vi.fn(),
}));

import { bringBrowserWindowToFront } from "@adapters/platform/bringBrowserWindowToFront.js";

type MockWindow = {
  isDestroyed: ReturnType<typeof vi.fn>;
};

function createMockWindow(destroyed = false): MockWindow {
  return { isDestroyed: vi.fn(() => destroyed) };
}

describe("ShellWindowAttentionController", () => {
  beforeEach(() => {
    vi.mocked(bringBrowserWindowToFront).mockClear();
  });
  it("returns not_ready when window is missing", () => {
    const controller = new ShellWindowAttentionController({
      getMainWindow: () => null,
    });
    expect(controller.raise({ reason: "incoming_call" })).toEqual({
      ok: false,
      code: "not_ready",
    });
    expect(bringBrowserWindowToFront).not.toHaveBeenCalled();
  });

  it("raises once per dedupe key and ignores duplicates", () => {
    const window = createMockWindow();
    const controller = new ShellWindowAttentionController({
      getMainWindow: () => window as unknown as Electron.BrowserWindow,
    });

    expect(
      controller.raise({ reason: "incoming_call", dedupeKey: "call_1" }),
    ).toEqual({ ok: true });
    expect(
      controller.raise({ reason: "incoming_call", dedupeKey: "call_1" }),
    ).toEqual({ ok: false, code: "duplicate" });
    expect(bringBrowserWindowToFront).toHaveBeenCalledTimes(1);
  });

  it("allows different reasons or keys", () => {
    const window = createMockWindow();
    const controller = new ShellWindowAttentionController({
      getMainWindow: () => window as unknown as Electron.BrowserWindow,
    });

    expect(
      controller.raise({ reason: "incoming_call", dedupeKey: "call_1" }),
    ).toEqual({ ok: true });
    expect(
      controller.raise({ reason: "outgoing_call", dedupeKey: "call_1" }),
    ).toEqual({ ok: true });
    expect(
      controller.raise({ reason: "incoming_call", dedupeKey: "call_2" }),
    ).toEqual({ ok: true });
    expect(bringBrowserWindowToFront).toHaveBeenCalledTimes(3);
  });
});
