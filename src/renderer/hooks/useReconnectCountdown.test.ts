// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReconnectCountdown } from "./useReconnectCountdown.js";

describe("useReconnectCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-24T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when not reconnecting", () => {
    const { result } = renderHook(() => useReconnectCountdown("2026-06-24T12:00:05.000Z", "connected"));
    expect(result.current).toBeNull();
  });

  it("computes seconds remaining from nextRetryAt", () => {
    const { result } = renderHook(() =>
      useReconnectCountdown("2026-06-24T12:00:05.000Z", "reconnecting"),
    );
    expect(result.current).toBe(5);
  });

  it("ticks down each second while reconnecting", () => {
    const { result } = renderHook(() =>
      useReconnectCountdown("2026-06-24T12:00:05.000Z", "reconnecting"),
    );
    expect(result.current).toBe(5);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(4);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBeNull();
  });

  it("returns null at zero instead of showing frozen countdown", () => {
    const { result } = renderHook(() =>
      useReconnectCountdown("2026-06-24T12:00:03.000Z", "reconnecting"),
    );
    expect(result.current).toBe(3);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBeNull();
  });

  it("cleans up interval on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderHook(() =>
      useReconnectCountdown("2026-06-24T12:00:10.000Z", "reconnecting"),
    );

    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
