import { describe, expect, it, vi } from "vitest";
import { SHELL_WINDOW_LAYOUT } from "@domain/platform/ShellWindowLayout.js";
import type { ShellWindowGateway } from "@ports/platform/ShellWindowGateway.js";
import {
  resolveShellWindowLayoutMode,
  ShellWindowLayoutService,
} from "./ShellWindowLayoutService.js";

function createGatewayMock(): ShellWindowGateway & { applyLayout: ReturnType<typeof vi.fn> } {
  const applyLayout = vi.fn(() => Promise.resolve());
  return { applyLayout };
}

describe("resolveShellWindowLayoutMode", () => {
  it("prefers settings over video fullscreen", () => {
    expect(
      resolveShellWindowLayoutMode({ settingsOpen: true, videoFullscreen: true }),
    ).toBe("settings");
  });

  it("uses video-fullscreen when settings closed", () => {
    expect(
      resolveShellWindowLayoutMode({ settingsOpen: false, videoFullscreen: true }),
    ).toBe("video-fullscreen");
  });

  it("uses compact by default", () => {
    expect(
      resolveShellWindowLayoutMode({ settingsOpen: false, videoFullscreen: false }),
    ).toBe("compact");
  });
});

describe("ShellWindowLayoutService", () => {
  it("requests settings layout when overlay opens", async () => {
    const gateway = createGatewayMock();
    const service = new ShellWindowLayoutService(gateway);

    await service.syncLayout({
      settingsOpen: true,
      videoFullscreen: false,
      reducedMotion: false,
    });

    expect(gateway.applyLayout).toHaveBeenCalledWith({
      mode: "settings",
      animationDurationMs: SHELL_WINDOW_LAYOUT.animationDurationMs,
      reducedMotion: false,
    });
  });

  it("requests video-fullscreen layout when video session is fullscreen", async () => {
    const gateway = createGatewayMock();
    const service = new ShellWindowLayoutService(gateway);

    await service.syncLayout({
      settingsOpen: false,
      videoFullscreen: true,
      reducedMotion: false,
    });

    expect(gateway.applyLayout).toHaveBeenCalledWith({
      mode: "video-fullscreen",
      animationDurationMs: SHELL_WINDOW_LAYOUT.animationDurationMs,
      reducedMotion: false,
    });
  });

  it("requests compact layout without animation when settings close", async () => {
    const gateway = createGatewayMock();
    const service = new ShellWindowLayoutService(gateway);

    await service.syncLayout({
      settingsOpen: false,
      videoFullscreen: false,
      reducedMotion: false,
    });

    expect(gateway.applyLayout).toHaveBeenCalledWith({
      mode: "compact",
      animationDurationMs: 0,
      reducedMotion: false,
    });
  });
});
