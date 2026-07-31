// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeadlineCountdown } from "./useDeadlineCountdown.js";

describe("useDeadlineCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-23T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when inactive", () => {
    const { result } = renderHook(() =>
      useDeadlineCountdown("2026-07-23T12:00:30.000Z", false),
    );
    expect(result.current).toBeNull();
  });

  it("ticks remaining seconds down to zero", () => {
    const { result } = renderHook(() =>
      useDeadlineCountdown("2026-07-23T12:00:02.000Z", true),
    );
    expect(result.current).toBe(2);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(0);
  });
});
