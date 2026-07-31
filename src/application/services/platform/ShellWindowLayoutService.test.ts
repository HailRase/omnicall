import { describe, expect, it, vi } from "vitest";
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
  it("requests settings layout instantly when overlay opens", async () => {
    const gateway = createGatewayMock();
    const service = new ShellWindowLayoutService(gateway);

    await service.syncLayout({
      settingsOpen: true,
      videoFullscreen: false,
      reducedMotion: false,
    });

    expect(gateway.applyLayout).toHaveBeenCalledWith({
      mode: "settings",
      animationDurationMs: 0,
      reducedMotion: false,
    });
  });

  it("requests video-fullscreen layout instantly", async () => {
    const gateway = createGatewayMock();
    const service = new ShellWindowLayoutService(gateway);

    await service.syncLayout({
      settingsOpen: false,
      videoFullscreen: true,
      reducedMotion: false,
    });

    expect(gateway.applyLayout).toHaveBeenCalledWith({
      mode: "video-fullscreen",
      animationDurationMs: 0,
      reducedMotion: false,
    });
  });

  it("requests compact layout instantly when settings close", async () => {
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
