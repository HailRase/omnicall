// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useNotifications } from "./useNotifications.js";

describe("useNotifications", () => {
  it("does not replace queue entry for same id and equivalent descriptor", () => {
    const { result } = renderHook(() =>
      useNotifications({
        placement: "bottom-right",
        stacking: "stacked",
        durationMs: 2000,
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
    const firstItemsReference = result.current.items;

    act(() => {
      result.current.notify({
        id: "one",
        level: "info",
        messageText: "ok",
      });
    });

    expect(result.current.items).toBe(firstItemsReference);
    expect(result.current.items).toHaveLength(1);
  });

  it("updates same id when descriptor changes", () => {
    const { result } = renderHook(() =>
      useNotifications({
        placement: "bottom-right",
        stacking: "stacked",
        durationMs: 2000,
        maxVisible: 3,
      }),
    );

    act(() => {
      result.current.notify({
        id: "one",
        level: "info",
        messageText: "old",
      });
    });

    act(() => {
      result.current.notify({
        id: "one",
        level: "error",
        messageText: "new",
        durationMs: 5000,
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual(
      expect.objectContaining({
        id: "one",
        level: "error",
        messageText: "new",
        durationMs: 5000,
      }),
    );
  });

  it("keeps one visible item in single mode", () => {
    const { result } = renderHook(() =>
      useNotifications({
        placement: "bottom-right",
        stacking: "single",
        durationMs: 4000,
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

  it("applies updated default duration only to new notifications", () => {
    const { result, rerender } = renderHook(
      (props: { durationMs: number }) =>
        useNotifications({
          placement: "bottom-right",
          stacking: "stacked",
          durationMs: props.durationMs,
          maxVisible: 3,
        }),
      {
        initialProps: {
          durationMs: 1000,
        },
      },
    );

    act(() => {
      result.current.notify({ id: "first", level: "info", messageText: "first" });
    });

    rerender({ durationMs: 5000 });

    act(() => {
      result.current.notify({ id: "second", level: "info", messageText: "second" });
    });

    expect(result.current.items.find((item) => item.id === "first")).toEqual(
      expect.objectContaining({
        durationMs: 1000,
        closable: true,
      }),
    );
    expect(result.current.items.find((item) => item.id === "second")).toEqual(
      expect.objectContaining({
        durationMs: 5000,
        closable: true,
      }),
    );
  });
});
