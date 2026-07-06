// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useNotifications } from "./useNotifications.js";

describe("useNotifications", () => {
  it("enqueues and auto-dismisses notifications by duration", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useNotifications({
        placement: "bottom-right",
        stacking: "stacked",
        durationMs: 2000,
        closable: true,
        maxVisible: 3,
      }),
    );

    act(() => {
      result.current.notify({
        id: "one",
        level: "info",
        messageText: "ok",
      });
    });
    expect(result.current.items).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(result.current.items).toHaveLength(0);
    vi.useRealTimers();
  });

  it("keeps one visible item in single mode", () => {
    const { result } = renderHook(() =>
      useNotifications({
        placement: "bottom-right",
        stacking: "single",
        durationMs: 4000,
        closable: true,
        maxVisible: 3,
      }),
    );

    act(() => {
      result.current.notify({ id: "first", level: "info", messageText: "first" });
      result.current.notify({ id: "second", level: "info", messageText: "second" });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.id).toBe("second");
  });

  it("pauses and resumes timeout", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useNotifications({
        placement: "bottom-right",
        stacking: "stacked",
        durationMs: 2000,
        closable: true,
        maxVisible: 3,
      }),
    );

    act(() => {
      result.current.notify({ id: "pause-me", level: "info", messageText: "pause" });
      vi.advanceTimersByTime(900);
      result.current.pause("pause-me");
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.resume("pause-me");
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.items).toHaveLength(0);
    vi.useRealTimers();
  });
});
