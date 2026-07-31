// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOTSTRAP_SPLASH_MIN_VISIBLE_MS } from "@shared/platform/startupSplashColors.js";
import {
  BOOT_SPLASH_PROGRESS_SETTLE_MS,
  useBootstrapSplashProgress,
} from "./useBootstrapSplashProgress.js";

function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

describe("useBootstrapSplashProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "performance"] });
    stubReducedMotion(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("eases progress while loading without reaching 100", () => {
    const { result } = renderHook(() => useBootstrapSplashProgress("loading"));

    expect(result.current.showSplash).toBe(true);
    expect(result.current.progress).toBeLessThan(100);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.showSplash).toBe(true);
    expect(result.current.progress).toBeGreaterThan(40);
    expect(result.current.progress).toBeLessThanOrEqual(88);
  });

  it("holds bounce until min visible dwell before settling at 100", () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: "loading" | "ready" | "error" }) =>
        useBootstrapSplashProgress(status),
      { initialProps: { status: "loading" as "loading" | "ready" | "error" } },
    );

    rerender({ status: "ready" });

    expect(result.current.progress).toBeLessThan(100);
    expect(result.current.showSplash).toBe(true);

    act(() => {
      vi.advanceTimersByTime(BOOTSTRAP_SPLASH_MIN_VISIBLE_MS - 1);
    });

    expect(result.current.progress).toBeLessThan(100);
    expect(result.current.showSplash).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.progress).toBe(100);
    expect(result.current.showSplash).toBe(true);

    act(() => {
      vi.advanceTimersByTime(BOOT_SPLASH_PROGRESS_SETTLE_MS);
    });

    expect(result.current.showSplash).toBe(false);
  });

  it("settles immediately when ready after min dwell already elapsed", () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: "loading" | "ready" | "error" }) =>
        useBootstrapSplashProgress(status),
      { initialProps: { status: "loading" as "loading" | "ready" | "error" } },
    );

    act(() => {
      vi.advanceTimersByTime(BOOTSTRAP_SPLASH_MIN_VISIBLE_MS);
    });

    rerender({ status: "ready" });

    expect(result.current.progress).toBe(100);
    expect(result.current.showSplash).toBe(true);

    act(() => {
      vi.advanceTimersByTime(BOOT_SPLASH_PROGRESS_SETTLE_MS);
    });

    expect(result.current.showSplash).toBe(false);
  });

  it("skips min dwell when prefers-reduced-motion is set", () => {
    stubReducedMotion(true);

    const { result, rerender } = renderHook(
      ({ status }: { status: "loading" | "ready" | "error" }) =>
        useBootstrapSplashProgress(status),
      { initialProps: { status: "loading" as "loading" | "ready" | "error" } },
    );

    rerender({ status: "ready" });

    expect(result.current.progress).toBe(100);
    expect(result.current.showSplash).toBe(true);

    act(() => {
      vi.advanceTimersByTime(BOOT_SPLASH_PROGRESS_SETTLE_MS);
    });

    expect(result.current.showSplash).toBe(false);
  });
});
