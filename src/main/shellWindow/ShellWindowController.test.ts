import { describe, expect, it, vi } from "vitest";
import { SHELL_WINDOW_LAYOUT } from "@domain/platform/ShellWindowLayout.js";
import { ShellWindowController, sanitizeCompactDimensions } from "./ShellWindowController.js";

const WORK_AREA = {
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
} as const;

type MockBrowserWindow = {
  getBounds: ReturnType<typeof vi.fn>;
  setBounds: ReturnType<typeof vi.fn>;
  setResizable: ReturnType<typeof vi.fn>;
  setMaximizable: ReturnType<typeof vi.fn>;
  setMinimumSize: ReturnType<typeof vi.fn>;
  isMaximized: ReturnType<typeof vi.fn>;
  maximize: ReturnType<typeof vi.fn>;
  unmaximize: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

function createMockWindow(bounds: Electron.Rectangle): MockBrowserWindow {
  let currentBounds = { ...bounds };
  const handlers = new Map<string, Array<() => void>>();

  const window: MockBrowserWindow = {
    getBounds: vi.fn(() => ({ ...currentBounds })),
    setBounds: vi.fn((next: Partial<Electron.Rectangle>) => {
      currentBounds = { ...currentBounds, ...next };
      for (const handler of handlers.get("resized") ?? []) {
        handler();
      }
    }),
    setResizable: vi.fn(),
    setMaximizable: vi.fn(),
    setMinimumSize: vi.fn(),
    isMaximized: vi.fn(() => false),
    maximize: vi.fn(),
    unmaximize: vi.fn(),
    on: vi.fn((event: string, handler: () => void) => {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
      return window;
    }),
  };

  return window;
}

describe("ShellWindowController", () => {
  it("locks resize and maximize on compact startup placement", () => {
    const window = createMockWindow({ x: 100, y: 200, width: 420, height: 720 });
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );

    controller.placeCompactAtStartup();

    expect(window.setResizable).toHaveBeenCalledWith(false);
    expect(window.setMaximizable).toHaveBeenCalledWith(false);
    expect(window.setMinimumSize).toHaveBeenCalledWith(
      SHELL_WINDOW_LAYOUT.compactMinWidth,
      SHELL_WINDOW_LAYOUT.compactMinHeight,
    );
    expect(controller.getState().activeMode).toBe("compact");
  });

  it("disables resize immediately when closing settings", async () => {
    const window = createMockWindow({ x: 460, y: 180, width: 1000, height: 720 });
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );

    await controller.applyLayout("settings", 0, true);
    window.setResizable.mockClear();
    window.setMaximizable.mockClear();

    await controller.applyLayout("compact", 0, true);

    expect(window.setResizable).toHaveBeenCalledWith(false);
    expect(window.setMaximizable).toHaveBeenCalledWith(false);
    expect(controller.getState().activeMode).toBe("compact");
  });

  it("keeps OS maximizable disabled after settings layout completes", async () => {
    const window = createMockWindow({
      x: 1920 - 420 - SHELL_WINDOW_LAYOUT.screenMargin,
      y: 1080 - SHELL_WINDOW_LAYOUT.compactDefaultHeight - SHELL_WINDOW_LAYOUT.screenMargin,
      width: 420,
      height: SHELL_WINDOW_LAYOUT.compactDefaultHeight,
    });
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );

    controller.placeCompactAtStartup();
    window.setResizable.mockClear();
    window.setMaximizable.mockClear();
    window.setMinimumSize.mockClear();

    await controller.applyLayout("settings", 0, true);

    expect(window.setResizable).toHaveBeenCalledWith(true);
    expect(window.setMaximizable).toHaveBeenCalledWith(false);
    expect(window.setMinimumSize).toHaveBeenCalledWith(
      SHELL_WINDOW_LAYOUT.settingsMinWidth,
      SHELL_WINDOW_LAYOUT.settingsMinHeight,
    );
    expect(controller.getState().activeMode).toBe("settings");
  });

  it("rejects maximize outside settings mode", () => {
    const window = createMockWindow({ x: 100, y: 200, width: 420, height: 720 });
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );

    controller.placeCompactAtStartup();

    expect(controller.toggleMaximize()).toEqual({
      ok: false,
      reason: "not_settings_mode",
    });
    expect(window.maximize).not.toHaveBeenCalled();
    expect(window.setBounds).toHaveBeenCalledTimes(1);
  });

  it("fills work area via setBounds and restores to settings minimum bounds", async () => {
    const window = createMockWindow({
      x: 1920 - 420 - SHELL_WINDOW_LAYOUT.screenMargin,
      y: 1080 - 720 - SHELL_WINDOW_LAYOUT.screenMargin,
      width: 420,
      height: 720,
    });
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );
    const onMaximizedChange = vi.fn();
    controller.onMaximizedChange(onMaximizedChange);

    controller.placeCompactAtStartup();
    await controller.applyLayout("settings", 0, true);

    window.setBounds({
      x: 100,
      y: 50,
      width: 1400,
      height: 900,
    });

    expect(controller.toggleMaximize()).toEqual({ ok: true });
    expect(window.maximize).not.toHaveBeenCalled();
    expect(controller.isMaximized()).toBe(true);
    expect(onMaximizedChange).toHaveBeenCalledWith(true);
    expect(window.getBounds()).toEqual({
      x: WORK_AREA.x,
      y: WORK_AREA.y,
      width: WORK_AREA.width,
      height: WORK_AREA.height,
    });

    expect(controller.toggleMaximize()).toEqual({ ok: true });
    expect(window.unmaximize).not.toHaveBeenCalled();
    expect(controller.isMaximized()).toBe(false);
    expect(onMaximizedChange).toHaveBeenCalledWith(false);
    expect(window.getBounds()).toEqual({
      x: Math.round((1920 - SHELL_WINDOW_LAYOUT.settingsMinWidth) / 2),
      y: Math.round((1080 - 900) / 2),
      width: SHELL_WINDOW_LAYOUT.settingsMinWidth,
      height: 900,
    });
  });

  it("closes work-area settings to compact in one bounds step without OS maximize", async () => {
    const compactBounds = {
      x: 1920 - 420 - SHELL_WINDOW_LAYOUT.screenMargin,
      y: 1080 - 720 - SHELL_WINDOW_LAYOUT.screenMargin,
      width: 420,
      height: 720,
    };
    const window = createMockWindow(compactBounds);
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );
    const onMaximizedChange = vi.fn();
    controller.onMaximizedChange(onMaximizedChange);

    controller.placeCompactAtStartup();
    await controller.applyLayout("settings", 0, true);
    expect(controller.toggleMaximize()).toEqual({ ok: true });
    expect(window.getBounds()).toEqual({
      x: WORK_AREA.x,
      y: WORK_AREA.y,
      width: WORK_AREA.width,
      height: WORK_AREA.height,
    });

    window.setBounds.mockClear();
    onMaximizedChange.mockClear();
    await controller.applyLayout("compact", 0, true);

    expect(window.maximize).not.toHaveBeenCalled();
    expect(window.unmaximize).not.toHaveBeenCalled();
    expect(window.setBounds).toHaveBeenCalledTimes(1);
    expect(window.setBounds).toHaveBeenCalledWith(compactBounds);
    expect(window.getBounds()).toEqual(compactBounds);
    expect(controller.isMaximized()).toBe(false);
    expect(onMaximizedChange).toHaveBeenCalledWith(false);
  });

  it("preserves work-area fill when settings layout is re-applied", async () => {
    const window = createMockWindow({
      x: 1920 - 420 - SHELL_WINDOW_LAYOUT.screenMargin,
      y: 1080 - 720 - SHELL_WINDOW_LAYOUT.screenMargin,
      width: 420,
      height: 720,
    });
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );

    controller.placeCompactAtStartup();
    await controller.applyLayout("settings", 0, true);
    expect(controller.toggleMaximize()).toEqual({ ok: true });

    await controller.applyLayout("settings", 0, true);

    expect(controller.isMaximized()).toBe(true);
    expect(window.getBounds()).toEqual({
      x: WORK_AREA.x,
      y: WORK_AREA.y,
      width: WORK_AREA.width,
      height: WORK_AREA.height,
    });
  });

  it("restores compact width and height after settings resize", async () => {
    const compactBounds = {
      x: 1920 - 420 - SHELL_WINDOW_LAYOUT.screenMargin,
      y: 1080 - 720 - SHELL_WINDOW_LAYOUT.screenMargin,
      width: 420,
      height: 720,
    };
    const window = createMockWindow(compactBounds);
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );

    controller.placeCompactAtStartup();
    await controller.applyLayout("settings", 0, true);

    window.setBounds({
      x: 200,
      y: 100,
      width: 1200,
      height: 900,
    });

    await controller.applyLayout("compact", 0, true);

    expect(window.getBounds()).toEqual(compactBounds);
    expect(controller.getState().compactDimensions).toEqual({
      width: 420,
      height: 720,
    });
  });

  it("restores compact size after video-fullscreen without corrupting snapshot", async () => {
    const compactBounds = {
      x: 1920 - 420 - SHELL_WINDOW_LAYOUT.screenMargin,
      y: 1080 - 720 - SHELL_WINDOW_LAYOUT.screenMargin,
      width: 420,
      height: 720,
    };
    const window = createMockWindow(compactBounds);
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );

    controller.placeCompactAtStartup();
    await controller.applyLayout("video-fullscreen", 0, true);
    expect(window.getBounds()).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    });

    // Re-entrant fullscreen apply must not overwrite compact snapshot with work-area size.
    await controller.applyLayout("video-fullscreen", 0, true);
    await controller.applyLayout("compact", 0, true);

    expect(window.getBounds()).toEqual(compactBounds);
    expect(controller.getState().compactDimensions).toEqual({
      width: 420,
      height: 720,
    });
  });

  it("sanitizes compact dimensions that look like the work area", () => {
    expect(
      sanitizeCompactDimensions({ width: 1900, height: 1060 }, WORK_AREA),
    ).toEqual({
      width: SHELL_WINDOW_LAYOUT.compactDefaultWidth,
      height: SHELL_WINDOW_LAYOUT.compactDefaultHeight,
    });
    expect(
      sanitizeCompactDimensions({ width: 420, height: 720 }, WORK_AREA),
    ).toEqual({ width: 420, height: 720 });
  });
});
