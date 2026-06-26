// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOverlayShell } from "./useOverlayShell.js";

describe("useOverlayShell", () => {
  it("opens settings on general section by default", () => {
    const { result } = renderHook(() => useOverlayShell());

    act(() => {
      result.current.openSettings();
    });

    expect(result.current.settingsOpen).toBe(true);
    expect(result.current.settingsSection).toBe("general");
  });

  it("opens diagnostics section from header shortcut", () => {
    const { result } = renderHook(() => useOverlayShell());

    act(() => {
      result.current.openDiagnostics();
    });

    expect(result.current.settingsOpen).toBe(true);
    expect(result.current.settingsSection).toBe("diagnostics");
  });

  it("closes overlay", () => {
    const { result } = renderHook(() => useOverlayShell());

    act(() => {
      result.current.openSettings("sessions");
    });
    expect(result.current.settingsOpen).toBe(true);

    act(() => {
      result.current.closeOverlay();
    });
    expect(result.current.settingsOpen).toBe(false);
  });

  it("ignores non-section click event when used as onClick handler", () => {
    const { result } = renderHook(() => useOverlayShell());

    act(() => {
      result.current.openSettings({ type: "click" });
    });

    expect(result.current.settingsOpen).toBe(true);
    expect(result.current.settingsSection).toBe("general");
  });
});
