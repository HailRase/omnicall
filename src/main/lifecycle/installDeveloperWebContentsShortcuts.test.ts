import { describe, expect, it, vi } from "vitest";
import type { WebContents } from "electron";
import {
  installDeveloperWebContentsShortcuts,
  isDeveloperWebContentsShortcut,
} from "./installDeveloperWebContentsShortcuts.js";

describe("isDeveloperWebContentsShortcut", () => {
  it("matches F12 on keyDown", () => {
    expect(
      isDeveloperWebContentsShortcut({
        type: "keyDown",
        key: "F12",
      }),
    ).toBe(true);
  });

  it("matches Ctrl+Shift+I on keyDown", () => {
    expect(
      isDeveloperWebContentsShortcut({
        type: "keyDown",
        key: "I",
        control: true,
        shift: true,
      }),
    ).toBe(true);
  });

  it("ignores keyUp and unrelated shortcuts", () => {
    expect(
      isDeveloperWebContentsShortcut({
        type: "keyUp",
        key: "F12",
      }),
    ).toBe(false);

    expect(
      isDeveloperWebContentsShortcut({
        type: "keyDown",
        key: "I",
        control: true,
      }),
    ).toBe(false);
  });
});

describe("installDeveloperWebContentsShortcuts", () => {
  it("does not register listeners in production mode", () => {
    const on = vi.fn();
    const webContents = { on } as unknown as WebContents;

    installDeveloperWebContentsShortcuts(webContents, {
      isDevMode: false,
      platform: "win32",
    });

    expect(on).not.toHaveBeenCalled();
  });

  it("does not register listeners on macOS even in dev mode", () => {
    const on = vi.fn();
    const webContents = { on } as unknown as WebContents;

    installDeveloperWebContentsShortcuts(webContents, {
      isDevMode: true,
      platform: "darwin",
    });

    expect(on).not.toHaveBeenCalled();
  });

  it("registers before-input listener on Windows dev builds", () => {
    const on = vi.fn();
    const webContents = { on } as unknown as WebContents;

    installDeveloperWebContentsShortcuts(webContents, {
      isDevMode: true,
      platform: "win32",
    });

    expect(on).toHaveBeenCalledWith("before-input-event", expect.any(Function));
  });
});
