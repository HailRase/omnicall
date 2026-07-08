// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDialogReturnFocus } from "./useDialogReturnFocus.js";

describe("useDialogReturnFocus", () => {
  it("restores focus to the trigger element on close", () => {
    const button = document.createElement("button");
    document.body.append(button);

    const { result } = renderHook(() => useDialogReturnFocus<HTMLButtonElement>());
    result.current.triggerRef.current = button;

    const event = new Event("focusin");
    const preventDefault = vi.spyOn(event, "preventDefault");

    act(() => {
      result.current.onCloseAutoFocus(event);
    });

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(button);
  });
});
