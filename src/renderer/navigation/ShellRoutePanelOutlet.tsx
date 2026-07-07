import type { JSX } from "react";
import { Outlet } from "react-router-dom";
import { useShellNavigation } from "./useShellNavigation.js";

/**
 * - Purpose: mount route-selected shell panel slot without replacing dialpad/call zones.
 * - Inputs: current hash route from React Router outlet context.
 * - Outputs: invisible route markers for Phase 1 navigation tests only.
 */
export function ShellRoutePanelOutlet(): JSX.Element | null {
  const { route } = useShellNavigation();

  return (
    <>
      <div
        data-testid="shell-route-panel-outlet"
        data-shell-route={route.name}
        hidden
        aria-hidden
      />
      <Outlet />
    </>
  );
}
