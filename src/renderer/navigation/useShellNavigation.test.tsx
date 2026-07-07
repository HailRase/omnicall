// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { initialMultiCallProjection } from "@application/projections/multiCallProjection.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useShellNavigation } from "./useShellNavigation.js";

function createShellNavigationHarness(initialPath: string) {
  return function ShellNavigationHarness({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    );
  };
}

function useCurrentPathname(): string {
  return useLocation().pathname;
}

describe("useShellNavigation", () => {
  it("parses the current hash route", () => {
    useAccountBootstrapStore.setState({
      multiCallProjection: initialMultiCallProjection(),
    });

    const wrapper = createShellNavigationHarness("/contacts/agent-1");
    const { result } = renderHook(() => useShellNavigation(), { wrapper });

    expect(result.current.route).toEqual({
      name: "contactDetails",
      contactId: "agent-1",
      notFound: false,
    });
    expect(result.current.presentation).toBe("sidebar");
  });

  it("navigates between shell routes", () => {
    useAccountBootstrapStore.setState({
      multiCallProjection: initialMultiCallProjection(),
    });

    const wrapper = createShellNavigationHarness("/");
    const { result } = renderHook(
      () => ({
        navigation: useShellNavigation(),
        pathname: useCurrentPathname(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.navigation.navigateTo({ name: "history" });
    });

    expect(result.current.pathname).toBe("/history");
    expect(result.current.navigation.route).toEqual({ name: "history" });
    expect(result.current.navigation.presentation).toBe("fullPanel");
  });

  it("uses sidebar history presentation during active call context", () => {
    useAccountBootstrapStore.setState({
      multiCallProjection: {
        ...initialMultiCallProjection(),
        hasEstablishedCall: true,
        establishedCallCount: 1,
      },
    });

    const wrapper = createShellNavigationHarness("/history");
    const { result } = renderHook(() => useShellNavigation(), { wrapper });

    expect(result.current.presentation).toBe("sidebar");
    expect(result.current.hasActiveCallContext).toBe(true);
  });

  it("falls back to dialpad for empty contact navigation targets", () => {
    useAccountBootstrapStore.setState({
      multiCallProjection: initialMultiCallProjection(),
    });

    const wrapper = createShellNavigationHarness("/contacts/agent-1");
    const { result } = renderHook(
      () => ({
        navigation: useShellNavigation(),
        pathname: useCurrentPathname(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.navigation.navigateTo({ name: "contactDetails", contactId: "   " });
    });

    expect(result.current.pathname).toBe("/");
  });
});
