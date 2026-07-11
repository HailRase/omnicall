// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShellWindowLayoutService } from "@application/services/platform/ShellWindowLayoutService.js";
import { useShellWindowLayout } from "./useShellWindowLayout.js";

vi.mock("@adapters/platform/PreloadShellWindowGateway.js", () => ({
  PreloadShellWindowGateway: vi.fn(),
}));

describe("useShellWindowLayout", () => {
  it("syncs layout when settings or video fullscreen state changes", () => {
    const syncSpy = vi
      .spyOn(ShellWindowLayoutService.prototype, "syncLayout")
      .mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ settingsOpen, videoFullscreen }) =>
        useShellWindowLayout({ settingsOpen, videoFullscreen }),
      { initialProps: { settingsOpen: false, videoFullscreen: false } },
    );

    expect(syncSpy).not.toHaveBeenCalled();

    act(() => {
      rerender({ settingsOpen: true, videoFullscreen: false });
    });

    expect(syncSpy).toHaveBeenCalledWith({
      settingsOpen: true,
      videoFullscreen: false,
      reducedMotion: expect.any(Boolean) as boolean,
    });

    act(() => {
      rerender({ settingsOpen: false, videoFullscreen: true });
    });

    expect(syncSpy).toHaveBeenLastCalledWith({
      settingsOpen: false,
      videoFullscreen: true,
      reducedMotion: expect.any(Boolean) as boolean,
    });

    act(() => {
      rerender({ settingsOpen: false, videoFullscreen: false });
    });

    expect(syncSpy).toHaveBeenLastCalledWith({
      settingsOpen: false,
      videoFullscreen: false,
      reducedMotion: expect.any(Boolean) as boolean,
    });

    syncSpy.mockRestore();
  });
});
