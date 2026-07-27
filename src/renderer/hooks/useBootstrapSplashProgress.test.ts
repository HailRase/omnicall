// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBootstrapSplashProgress } from "./useBootstrapSplashProgress.js";

describe("useBootstrapSplashProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
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

  it("settles at 100 and hides splash after ready", () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: "loading" | "ready" | "error" }) =>
        useBootstrapSplashProgress(status),
      { initialProps: { status: "loading" as "loading" | "ready" | "error" } },
    );

    rerender({ status: "ready" });

    expect(result.current.progress).toBe(100);
    expect(result.current.showSplash).toBe(true);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(result.current.showSplash).toBe(false);
  });
});
