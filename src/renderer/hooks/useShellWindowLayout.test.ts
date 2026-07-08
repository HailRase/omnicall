// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ShellWindowLayoutService } from "@application/services/platform/ShellWindowLayoutService.js";
import { useShellWindowLayout } from "./useShellWindowLayout.js";

vi.mock("@adapters/platform/PreloadShellWindowGateway.js", () => ({
  PreloadShellWindowGateway: vi.fn(),
}));

describe("useShellWindowLayout", () => {
  it("syncs layout when settings open state changes", () => {
    const syncSpy = vi
      .spyOn(ShellWindowLayoutService.prototype, "syncForSettingsOverlay")
      .mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ settingsOpen }) => useShellWindowLayout({ settingsOpen }),
      { initialProps: { settingsOpen: false } },
    );

    expect(syncSpy).not.toHaveBeenCalled();

    act(() => {
      rerender({ settingsOpen: true });
    });

    expect(syncSpy).toHaveBeenCalledWith({
      settingsOpen: true,
      reducedMotion: expect.any(Boolean) as boolean,
    });

    act(() => {
      rerender({ settingsOpen: false });
    });

    expect(syncSpy).toHaveBeenLastCalledWith({
      settingsOpen: false,
      reducedMotion: expect.any(Boolean) as boolean,
    });

    syncSpy.mockRestore();
  });
});
