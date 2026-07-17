// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { initialAccountBootstrapProjection } from "@application/projections/settings/accountBootstrapProjection.js";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useOverlayShell } from "./useOverlayShell.js";

/** Gate Settings on account session (ADR-AF-005), not SIP-ready alone. */
function setAccountSessionActive(active: boolean): void {
  useAccountBootstrapStore.setState({
    projection: {
      ...initialAccountBootstrapProjection(),
      authUiState: active ? "sip_registered" : "sip_only_ready",
      hasActiveAccountSession: active,
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
    setAccountSessionActive(true);
  });

  afterEach(() => {
    useAccountBootstrapStore.setState({
      projection: initialAccountBootstrapProjection(),
    });
  });

  it("opens settings on general section when account session is active", () => {
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

  it("opens settings on account section when account session is inactive", () => {
    setAccountSessionActive(false);

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

  it("redirects canonical /settings route to account when account session is inactive", async () => {
    setAccountSessionActive(false);

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

  it("redirects blocked direct settings section to account when account session is inactive", async () => {
    setAccountSessionActive(false);

    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/settings/general"]) },
    );

    await waitFor(() => {
      expect(result.current.pathname).toBe("/settings/account");
    });
    expect(result.current.overlay.settingsSection).toBe("account");
  });

  it("redirects integrations deep link to account when account session is inactive", async () => {
    setAccountSessionActive(false);

    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/settings/integrations"]) },
    );

    await waitFor(() => {
      expect(result.current.pathname).toBe("/settings/account");
    });
  });

  it("clamps setSettingsSection to account when account session is inactive", () => {
    setAccountSessionActive(false);

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

    expect(result.current.overlay.settingsSection).toBe("account");
    expect(result.current.pathname).toBe("/settings/account");
  });

  it("clamps codecs navigation when account session is inactive", () => {
    setAccountSessionActive(false);

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

    expect(result.current.overlay.settingsSection).toBe("account");
    expect(result.current.pathname).toBe("/settings/account");
  });

  it("opens diagnostics section from header shortcut when account session is active", () => {
    setAccountSessionActive(true);

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

  it("opens account instead of diagnostics when account session is inactive", () => {
    setAccountSessionActive(false);

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
    expect(result.current.overlay.settingsSection).toBe("account");
    expect(result.current.pathname).toBe("/settings/account");
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

  it("opens requested section via route when account session is active", () => {
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
    setAccountSessionActive(true);

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

  it("keeps active account session on all sections including integrations", async () => {
    setAccountSessionActive(true);

    const { result } = renderHook(
      () => ({
        overlay: useOverlayShell(),
        pathname: useTestLocation(),
      }),
      { wrapper: createRouterWrapper(["/settings/integrations"]) },
    );

    await waitFor(() => {
      expect(result.current.overlay.settingsOpen).toBe(true);
    });
    expect(result.current.pathname).toBe("/settings/integrations");
    expect(result.current.overlay.settingsSection).toBe("integrations");
  });
});
