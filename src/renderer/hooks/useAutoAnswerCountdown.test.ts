// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutoAnswerCountdown } from "./useAutoAnswerCountdown.js";

describe("useAutoAnswerCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when countdown is inactive", () => {
    const { result } = renderHook(() =>
      useAutoAnswerCountdown("2026-06-30T12:00:05.000Z", false),
    );
    expect(result.current).toBeNull();
  });

  it("ticks remaining seconds down to zero", () => {
    const { result } = renderHook(() =>
      useAutoAnswerCountdown("2026-06-30T12:00:05.000Z", true),
    );

    expect(result.current).toBe(5);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(4);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current).toBe(0);
  });
});
