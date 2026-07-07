import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { parseShellRoute } from "./parseShellRoute.js";
import {
  applyShellNavigationTargetGuard,
  resolveShellRoutePresentation,
} from "./shellNavigationGuards.js";
import { shellRouteToPath } from "./shellRoutePaths.js";
import type { ParsedShellRoute, ShellRoute, ShellRoutePresentation } from "./shellRouteModel.js";

export type UseShellNavigationResult = Readonly<{
  route: ParsedShellRoute;
  presentation: ShellRoutePresentation;
  hasActiveCallContext: boolean;
  navigateTo: (route: ShellRoute) => void;
  goToDialpad: () => void;
  goBackSafe: () => void;
}>;

/**
 * - Purpose: typed shell navigation facade over React Router hash routes.
 * - Inputs: router location, params, and multi-call projection flags.
 * - Outputs: parsed route, presentation guard, and navigation callbacks.
 */
export function useShellNavigation(): UseShellNavigationResult {
  const location = useLocation();
  const navigate = useNavigate();
  const hasEstablishedCall = useAccountBootstrapStore(
    (state) => state.multiCallProjection.hasEstablishedCall,
  );
  const hasConnectingCall = useAccountBootstrapStore(
    (state) => state.multiCallProjection.hasConnectingCall,
  );

  const hasActiveCallContext = hasEstablishedCall || hasConnectingCall;

  const route = useMemo(
    () => parseShellRoute(location.pathname),
    [location.pathname],
  );

  const presentation = useMemo(
    () =>
      resolveShellRoutePresentation(route, {
        hasActiveCallContext,
      }),
    [hasActiveCallContext, route],
  );

  const navigateTo = useCallback(
    (target: ShellRoute): void => {
      const guardedTarget = applyShellNavigationTargetGuard(target);
      void navigate(shellRouteToPath(guardedTarget));
    },
    [navigate],
  );

  const goToDialpad = useCallback((): void => {
    void navigate("/");
  }, [navigate]);

  const goBackSafe = useCallback((): void => {
    void navigate(-1);
  }, [navigate]);

  return {
    route,
    presentation,
    hasActiveCallContext,
    navigateTo,
    goToDialpad,
    goBackSafe,
  };
}
