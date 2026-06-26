import { describe, expect, it, vi } from "vitest";
import { SHELL_WINDOW_LAYOUT } from "@domain/platform/ShellWindowLayout.js";
import type { ShellWindowGateway } from "@ports/platform/ShellWindowGateway.js";
import { ShellWindowLayoutService } from "./ShellWindowLayoutService.js";

function createGatewayMock(): ShellWindowGateway & { applyLayout: ReturnType<typeof vi.fn> } {
  const applyLayout = vi.fn(() => Promise.resolve());
  return { applyLayout };
}

describe("ShellWindowLayoutService", () => {
  it("requests settings layout when overlay opens", async () => {
    const gateway = createGatewayMock();
    const service = new ShellWindowLayoutService(gateway);

    await service.syncForSettingsOverlay({
      settingsOpen: true,
      reducedMotion: false,
    });

    expect(gateway.applyLayout).toHaveBeenCalledWith({
      mode: "settings",
      animationDurationMs: SHELL_WINDOW_LAYOUT.animationDurationMs,
      reducedMotion: false,
    });
  });

  it("requests compact layout when overlay closes", async () => {
    const gateway = createGatewayMock();
    const service = new ShellWindowLayoutService(gateway);

    await service.syncForSettingsOverlay({
      settingsOpen: false,
      reducedMotion: true,
    });

    expect(gateway.applyLayout).toHaveBeenCalledWith({
      mode: "compact",
      animationDurationMs: SHELL_WINDOW_LAYOUT.animationDurationMs,
      reducedMotion: true,
    });
  });
});
