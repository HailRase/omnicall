// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { initialAccountBootstrapProjection } from "@application/projections/settings/accountBootstrapProjection.js";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useOverlayShell } from "./useOverlayShell.js";

function setSipRegistered(registered: boolean): void {
  useAccountBootstrapStore.setState({
    projection: {
      ...initialAccountBootstrapProjection(),
      authUiState: registered ? "sip_registered" : "sip_only_ready",
    },
  });
}

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
  beforeEach(() => {
    setSipRegistered(true);
  });

  afterEach(() => {
    useAccountBootstrapStore.setState({
      projection: initialAccountBootstrapProjection(),
    });
  });

  it("opens settings on general section when SIP is registered", () => {
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
    expect(result.current.pathname).toBe("/settings/general");
  });

  it("opens settings on account section when SIP is not registered", () => {
    setSipRegistered(false);

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
    expect(result.current.overlay.settingsSection).toBe("account");
    expect(result.current.pathname).toBe("/settings/account");
  });

  it("redirects canonical /settings route to account when SIP is not registered", async () => {
    setSipRegistered(false);

    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/settings"]) },
    );

    await waitFor(() => {
      expect(result.current.pathname).toBe("/settings/account");
    });
    expect(result.current.overlay.settingsSection).toBe("account");
  });

  it("keeps direct settings section route when SIP is not registered", async () => {
    setSipRegistered(false);

    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/settings/general"]) },
    );

    await waitFor(() => {
      expect(result.current.overlay.settingsOpen).toBe(true);
    });
    expect(result.current.pathname).toBe("/settings/general");
    expect(result.current.overlay.settingsSection).toBe("general");
  });

  it("navigates from account to general when SIP is not registered", () => {
    setSipRegistered(false);

    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/settings/account"]) },
    );

    act(() => {
      result.current.overlay.setSettingsSection("general");
    });

    expect(result.current.overlay.settingsSection).toBe("general");
    expect(result.current.pathname).toBe("/settings/general");
  });

  it("allows changing settings section when SIP is not registered", () => {
    setSipRegistered(false);

    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/settings/account"]) },
    );

    act(() => {
      result.current.overlay.setSettingsSection("codecs");
    });

    expect(result.current.overlay.settingsSection).toBe("codecs");
    expect(result.current.pathname).toBe("/settings/codecs");
  });

  it("opens diagnostics section from header shortcut", () => {
    setSipRegistered(true);

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

  it("opens diagnostics section from header shortcut when SIP is not registered", () => {
    setSipRegistered(false);

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
    setSipRegistered(true);

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
