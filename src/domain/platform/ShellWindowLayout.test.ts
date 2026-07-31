import { describe, expect, it } from "vitest";
import {
  computeBottomRightBounds,
  computeCenteredBounds,
  computeWorkAreaBounds,
  interpolateShellWindowBounds,
  resolveShellWindowAnimationProgress,
  resolveShellWindowMaximizable,
  resolveShellWindowMinimumSize,
  resolveShellWindowResizable,
  resolveShellWindowTargetBounds,
  SHELL_WINDOW_LAYOUT,
} from "./ShellWindowLayout.js";

const WORK_AREA = {
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
} as const;

describe("resolveShellWindowResizable", () => {
  it("disables user resize in compact mode", () => {
    expect(resolveShellWindowResizable("compact")).toBe(false);
  });

  it("enables user resize in settings mode", () => {
    expect(resolveShellWindowResizable("settings")).toBe(true);
  });

  it("disables user resize in video-fullscreen mode", () => {
    expect(resolveShellWindowResizable("video-fullscreen")).toBe(false);
  });
});

describe("resolveShellWindowMaximizable", () => {
  it("keeps OS maximizable disabled in every layout mode", () => {
    expect(resolveShellWindowMaximizable("compact")).toBe(false);
    expect(resolveShellWindowMaximizable("settings")).toBe(false);
    expect(resolveShellWindowMaximizable("video-fullscreen")).toBe(false);
  });
});

describe("resolveShellWindowMinimumSize", () => {
  it("uses settings floor in settings mode", () => {
    expect(resolveShellWindowMinimumSize("settings")).toEqual({
      width: SHELL_WINDOW_LAYOUT.settingsMinWidth,
      height: SHELL_WINDOW_LAYOUT.settingsMinHeight,
    });
  });

  it("uses compact floor outside settings", () => {
    expect(resolveShellWindowMinimumSize("compact")).toEqual({
      width: SHELL_WINDOW_LAYOUT.compactMinWidth,
      height: SHELL_WINDOW_LAYOUT.compactMinHeight,
    });
    expect(resolveShellWindowMinimumSize("video-fullscreen")).toEqual({
      width: SHELL_WINDOW_LAYOUT.compactMinWidth,
      height: SHELL_WINDOW_LAYOUT.compactMinHeight,
    });
  });
});

describe("resolveShellWindowTargetBounds", () => {
  it("places compact mode in the bottom-right with margin", () => {
    const bounds = resolveShellWindowTargetBounds(
      "compact",
      WORK_AREA,
      {
        width: SHELL_WINDOW_LAYOUT.compactDefaultWidth,
        height: 720,
      },
      720,
    );

    expect(bounds).toEqual({
      x: 1920 - 420 - SHELL_WINDOW_LAYOUT.screenMargin,
      y: 1080 - 720 - SHELL_WINDOW_LAYOUT.screenMargin,
      width: 420,
      height: 720,
    });
  });

  it("centers settings mode at 1000px width", () => {
    const bounds = resolveShellWindowTargetBounds(
      "settings",
      WORK_AREA,
      { width: 420, height: 720 },
      720,
    );

    expect(bounds).toEqual({
      x: Math.round((1920 - 1000) / 2),
      y: Math.round((1080 - 720) / 2),
      width: 1000,
      height: 720,
    });
  });

  it("fills the work area in video-fullscreen mode", () => {
    const bounds = resolveShellWindowTargetBounds(
      "video-fullscreen",
      WORK_AREA,
      { width: 420, height: 720 },
      720,
    );

    expect(bounds).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    });
  });
});

describe("computeBottomRightBounds", () => {
  it("respects work area offset", () => {
    const bounds = computeBottomRightBounds(
      { x: 100, y: 50, width: 800, height: 600 },
      300,
      400,
      8,
    );

    expect(bounds).toEqual({
      x: 100 + 800 - 300 - 8,
      y: 50 + 600 - 400 - 8,
      width: 300,
      height: 400,
    });
  });
});

describe("computeCenteredBounds", () => {
  it("centers within work area", () => {
    expect(computeCenteredBounds(WORK_AREA, 1000, 720)).toEqual({
      x: 460,
      y: 180,
      width: 1000,
      height: 720,
    });
  });
});

describe("computeWorkAreaBounds", () => {
  it("matches the work area rectangle", () => {
    expect(computeWorkAreaBounds(WORK_AREA)).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    });
  });
});

describe("interpolateShellWindowBounds", () => {
  it("returns start at progress 0 and end at progress 1", () => {
    const from = { x: 0, y: 0, width: 420, height: 720 };
    const to = { x: 460, y: 180, width: 1000, height: 720 };

    expect(interpolateShellWindowBounds(from, to, 0)).toEqual(from);
    expect(interpolateShellWindowBounds(from, to, 1)).toEqual(to);
  });
});

describe("resolveShellWindowAnimationProgress", () => {
  it("reaches 1 when duration elapsed", () => {
    expect(
      resolveShellWindowAnimationProgress(280, 280, "settings-open"),
    ).toBe(1);
    expect(
      resolveShellWindowAnimationProgress(280, 280, "settings-close"),
    ).toBe(1);
  });

  it("returns 0 at start", () => {
    expect(resolveShellWindowAnimationProgress(0, 280, "settings-open")).toBe(0);
  });
});
