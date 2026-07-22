/**
 * Unit tests for native bring-to-front helper (no Electron runtime).
 */

import { describe, expect, it, vi } from "vitest";

import { bringBrowserWindowToFront } from "./bringBrowserWindowToFront.js";

type MockWindow = {
  isMinimized: ReturnType<typeof vi.fn>;
  isAlwaysOnTop: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  show: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  moveTop: ReturnType<typeof vi.fn>;
  setAlwaysOnTop: ReturnType<typeof vi.fn>;
};

function createMockWindow(
  overrides: Partial<{ minimized: boolean; alwaysOnTop: boolean }> = {},
): MockWindow {
  return {
    isMinimized: vi.fn(() => overrides.minimized ?? false),
    isAlwaysOnTop: vi.fn(() => overrides.alwaysOnTop ?? false),
    restore: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    moveTop: vi.fn(),
    setAlwaysOnTop: vi.fn(),
  };
}

describe("bringBrowserWindowToFront", () => {
  it("restores minimized windows then shows, focuses, raises, and pulses", () => {
    const window = createMockWindow({ minimized: true });
    bringBrowserWindowToFront(window as unknown as Electron.BrowserWindow);
    expect(window.restore).toHaveBeenCalledTimes(1);
    expect(window.show).toHaveBeenCalledTimes(1);
    expect(window.focus).toHaveBeenCalledTimes(1);
    expect(window.moveTop).toHaveBeenCalledTimes(1);
    expect(window.setAlwaysOnTop).toHaveBeenNthCalledWith(1, true);
    expect(window.setAlwaysOnTop).toHaveBeenNthCalledWith(2, false);
  });

  it("shows and raises when already visible (occluded)", () => {
    const window = createMockWindow({ minimized: false });
    bringBrowserWindowToFront(window as unknown as Electron.BrowserWindow);
    expect(window.restore).not.toHaveBeenCalled();
    expect(window.show).toHaveBeenCalledTimes(1);
    expect(window.moveTop).toHaveBeenCalledTimes(1);
  });

  it("restores prior always-on-top pin after pulse", () => {
    const window = createMockWindow({ alwaysOnTop: true });
    bringBrowserWindowToFront(window as unknown as Electron.BrowserWindow);
    expect(window.setAlwaysOnTop).toHaveBeenNthCalledWith(1, true);
    expect(window.setAlwaysOnTop).toHaveBeenNthCalledWith(2, true);
  });
});
