// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useNotifications } from "./useNotifications.js";

describe("useNotifications", () => {
  it("enqueues and dismisses notifications", () => {
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
      result.current.dismiss("one");
    });
    expect(result.current.items).toHaveLength(0);
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

  it("limits visible items by maxVisible", () => {
    const { result } = renderHook(() =>
      useNotifications({
        placement: "bottom-right",
        stacking: "stacked",
        durationMs: 4000,
        closable: true,
        maxVisible: 2,
      }),
    );

    act(() => {
      result.current.notify({ id: "first", level: "info", messageText: "first" });
      result.current.notify({ id: "second", level: "info", messageText: "second" });
      result.current.notify({ id: "third", level: "info", messageText: "third" });
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.map((item) => item.id)).toEqual(["third", "second"]);
  });
});
