// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { useShellCollapse } from "./useShellCollapse.js";
import { renderHook, act } from "@testing-library/react";

describe("useShellCollapse", () => {
  it("starts expanded and toggles collapsed state", () => {
    const { result } = renderHook(() => useShellCollapse());

    expect(result.current.collapsed).toBe(false);

    act(() => {
      result.current.toggleCollapsed();
    });

    expect(result.current.collapsed).toBe(true);
  });
});
