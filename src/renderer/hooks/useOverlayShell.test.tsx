// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useOverlayShell } from "./useOverlayShell.js";

function createRouterWrapper(
  initialEntries: Array<string | { pathname: string; state?: unknown }>,
  initialIndex?: number,
) {
  return function RouterWrapper({ children }: Readonly<{ children: ReactNode }>) {
    const routerProps =
      initialIndex === undefined
        ? { initialEntries }
        : { initialEntries, initialIndex };

    return (
      <MemoryRouter {...routerProps}>
        <Routes>
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    );
  };
}

function useTestLocation(): string {
  return useLocation().pathname;
}

describe("useOverlayShell", () => {
  it("opens settings on general section by default", () => {
    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/"]) },
    );

    act(() => {
      result.current.overlay.openSettings();
    });

    expect(result.current.overlay.settingsOpen).toBe(true);
    expect(result.current.overlay.settingsSection).toBe("general");
    expect(result.current.pathname).toBe("/settings");
  });

  it("opens diagnostics section from header shortcut", () => {
    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/"]) },
    );

    act(() => {
      result.current.overlay.openDiagnostics();
    });

    expect(result.current.overlay.settingsOpen).toBe(true);
    expect(result.current.overlay.settingsSection).toBe("diagnostics");
    expect(result.current.pathname).toBe("/settings/diagnostics");
  });

  it("closes overlay and returns to previous shell destination", () => {
    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      {
        wrapper: createRouterWrapper(
          [
            { pathname: "/history" },
            { pathname: "/settings", state: { settingsReturnTo: "/history" } },
          ],
          1,
        ),
      },
    );

    expect(result.current.overlay.settingsOpen).toBe(true);

    act(() => {
      result.current.overlay.closeOverlay();
    });

    expect(result.current.overlay.settingsOpen).toBe(false);
    expect(result.current.pathname).toBe("/history");
  });

  it("opens requested section via route", () => {
    const { result } = renderHook(() => useOverlayShell(), {
      wrapper: createRouterWrapper(["/"]),
    });

    act(() => {
      result.current.openSettings("sessions");
    });

    expect(result.current.settingsOpen).toBe(true);
    expect(result.current.settingsSection).toBe("sessions");
  });

  it("ignores non-section click event when used as onClick handler", () => {
    const { result } = renderHook(() => useOverlayShell(), {
      wrapper: createRouterWrapper(["/"]),
    });

    act(() => {
      result.current.openSettings({ type: "click" });
    });

    expect(result.current.settingsOpen).toBe(true);
    expect(result.current.settingsSection).toBe("general");
  });

  it("replaces route when changing settings section", () => {
    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/settings"]) },
    );

    act(() => {
      result.current.overlay.setSettingsSection("account");
    });

    expect(result.current.overlay.settingsSection).toBe("account");
    expect(result.current.pathname).toBe("/settings/account");
  });
});
