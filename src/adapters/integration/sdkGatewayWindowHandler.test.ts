/**
 * DI-05 / ADR-0013 / WU-02: native window ops (no public revision clock).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { SdkWindowCommandHandler } from "./sdkGatewayWindowHandler.js";

vi.mock("@adapters/platform/bringBrowserWindowToFront.js", () => ({
  bringBrowserWindowToFront: vi.fn(),
}));

import { bringBrowserWindowToFront } from "@adapters/platform/bringBrowserWindowToFront.js";

type MockWindow = {
  isDestroyed: ReturnType<typeof vi.fn>;
  isVisible: ReturnType<typeof vi.fn>;
  hide: ReturnType<typeof vi.fn>;
};

function createMockWindow(
  overrides: Partial<{ destroyed: boolean; visible: boolean }> = {},
): MockWindow {
  return {
    isDestroyed: vi.fn(() => overrides.destroyed ?? false),
    isVisible: vi.fn(() => overrides.visible ?? true),
    hide: vi.fn(),
  };
}

describe("SdkWindowCommandHandler", () => {
  beforeEach(() => {
    vi.mocked(bringBrowserWindowToFront).mockClear();
  });

  it("returns not_ready when main window is missing", () => {
    const handler = new SdkWindowCommandHandler({
      getMainWindow: () => null,
    });
    expect(handler.show()).toEqual({ ok: false, code: "not_ready" });
  });

  it("returns not_ready when main window is destroyed", () => {
    const window = createMockWindow({ destroyed: true });
    const handler = new SdkWindowCommandHandler({
      getMainWindow: () => window as unknown as Electron.BrowserWindow,
    });
    expect(handler.show()).toEqual({ ok: false, code: "not_ready" });
  });

  it("shows successfully without owning a revision clock", () => {
    const window = createMockWindow();
    let now = 1_000;
    const handler = new SdkWindowCommandHandler({
      getMainWindow: () => window as unknown as Electron.BrowserWindow,
      nowMs: () => now,
      minShowIntervalMs: 1_000,
    });

    expect(handler.show()).toEqual({ ok: true, visible: true });
    expect(bringBrowserWindowToFront).toHaveBeenCalledTimes(1);

    now = 2_100;
    expect(handler.show()).toEqual({ ok: true, visible: true });
    expect(bringBrowserWindowToFront).toHaveBeenCalledTimes(2);
  });

  it("rate-limits rapid successive shows (ADR-0013 focus-stealing guard)", () => {
    const window = createMockWindow();
    let now = 5_000;
    const handler = new SdkWindowCommandHandler({
      getMainWindow: () => window as unknown as Electron.BrowserWindow,
      nowMs: () => now,
      minShowIntervalMs: 1_000,
    });

    expect(handler.show()).toEqual({ ok: true, visible: true });
    now = 5_500;
    expect(handler.show()).toEqual({ ok: false, code: "rate_limited" });
    expect(bringBrowserWindowToFront).toHaveBeenCalledTimes(1);
  });

  it("getState reports visibility without raising", () => {
    const window = createMockWindow({ visible: false });
    const handler = new SdkWindowCommandHandler({
      getMainWindow: () => window as unknown as Electron.BrowserWindow,
    });

    expect(handler.getState()).toEqual({
      ok: true,
      visible: false,
    });
    expect(bringBrowserWindowToFront).not.toHaveBeenCalled();
  });

  it("hides successfully when telephony is idle", () => {
    const window = createMockWindow();
    const onHidden = vi.fn();
    const handler = new SdkWindowCommandHandler({
      getMainWindow: () => window as unknown as Electron.BrowserWindow,
      onHidden,
    });

    expect(handler.hide()).toEqual({
      ok: true,
      visible: false,
    });
    expect(window.hide).toHaveBeenCalledTimes(1);
    expect(onHidden).toHaveBeenCalledTimes(1);
  });

  it("returns conflict on hide while telephony busy", () => {
    const window = createMockWindow();
    const handler = new SdkWindowCommandHandler({
      getMainWindow: () => window as unknown as Electron.BrowserWindow,
      isTelephonyBusy: () => true,
    });
    expect(handler.hide()).toEqual({ ok: false, code: "conflict" });
    expect(window.hide).not.toHaveBeenCalled();
  });
});
