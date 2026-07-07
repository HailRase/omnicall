import { describe, expect, it, vi } from "vitest";
import { SHELL_WINDOW_LAYOUT } from "@domain/platform/ShellWindowLayout.js";
import { ShellWindowController } from "./ShellWindowController.js";

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
};

function createMockWindow(bounds: Electron.Rectangle): MockBrowserWindow {
  let currentBounds = { ...bounds };

  return {
    getBounds: vi.fn(() => ({ ...currentBounds })),
    setBounds: vi.fn((next: Partial<Electron.Rectangle>) => {
      currentBounds = { ...currentBounds, ...next };
    }),
    setResizable: vi.fn(),
  };
}

describe("ShellWindowController", () => {
  it("locks resize on compact startup placement", () => {
    const window = createMockWindow({ x: 100, y: 200, width: 420, height: 720 });
    const controller = new ShellWindowController(
      window as unknown as Electron.BrowserWindow,
      () => WORK_AREA,
    );

    controller.placeCompactAtStartup();

    expect(window.setResizable).toHaveBeenCalledWith(false);
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

    await controller.applyLayout("compact", 0, true);

    expect(window.setResizable).toHaveBeenCalledWith(false);
    expect(controller.getState().activeMode).toBe("compact");
  });

  it("enables resize after settings layout transition completes", async () => {
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
    window.setResizable.mockClear();

    await controller.applyLayout("settings", 0, true);

    expect(window.setResizable).toHaveBeenCalledWith(true);
    expect(controller.getState().activeMode).toBe("settings");
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
});
