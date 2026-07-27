// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOT_SPLASH_EXIT_MS } from "../helpers/bootSplashDom.js";
import { useBootSplashController } from "./useBootSplashController.js";

function mountBootSplash(): void {
  document.body.innerHTML = `
    <div id="boot-splash">
      <p id="boot-splash-message">Loading…</p>
      <div id="boot-splash-indicator"></div>
    </div>
  `;
}

describe("useBootSplashController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mountBootSplash();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("keeps the HTML splash and updates progress while loading", () => {
    const { result } = renderHook(() =>
      useBootSplashController("loading", "Loading application…"),
    );

    expect(result.current.showReadyShell).toBe(false);
    expect(document.getElementById("boot-splash")).not.toBeNull();
    expect(document.getElementById("boot-splash-message")?.textContent).toBe(
      "Loading application…",
    );
    expect(document.getElementById("boot-splash")?.dataset['progressMode']).toBe("determinate");
  });

  it("crossfades: ready shell may show while splash exits, then splash is removed", async () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: "loading" | "ready" | "error" }) =>
        useBootSplashController(status, "Loading application…"),
      { initialProps: { status: "loading" as "loading" | "ready" | "error" } },
    );

    rerender({ status: "ready" });
    expect(result.current.showReadyShell).toBe(false);
    expect(document.getElementById("boot-splash")?.dataset['settled']).toBe("true");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(result.current.showReadyShell).toBe(true);
    expect(document.getElementById("boot-splash")?.dataset['exiting']).toBe("true");
    expect(document.getElementById("boot-splash")).not.toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(BOOT_SPLASH_EXIT_MS + 80);
    });

    expect(document.getElementById("boot-splash")).toBeNull();
  });

  it("dismisses HTML splash immediately on error", () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: "loading" | "ready" | "error" }) =>
        useBootSplashController(status, "Loading application…"),
      { initialProps: { status: "loading" as "loading" | "ready" | "error" } },
    );

    rerender({ status: "error" });
    expect(result.current.showReadyShell).toBe(false);
    expect(document.getElementById("boot-splash")).toBeNull();
  });
});
