import type {
  ParsedShellRoute,
  ShellNavigationGuardContext,
  ShellRoute,
  ShellRoutePresentation,
} from "./shellRouteModel.js";

/**
 * - Purpose: enforce active-call-sensitive panel presentation without redirecting telephony state.
 * - Inputs: parsed route and call-context guard flags.
 * - Outputs: panel presentation mode for future sidebar/full-panel shells.
 */
export function resolveShellRoutePresentation(
  route: ParsedShellRoute,
  context: ShellNavigationGuardContext,
): ShellRoutePresentation {
  switch (route.name) {
    case "history":
      return context.hasActiveCallContext ? "sidebar" : "fullPanel";
    case "contacts":
    case "contactDetails":
    case "contactEdit":
      return "sidebar";
    default:
      return "none";
  }
}

/**
 * - Purpose: block navigation to invalid contact targets before router transition.
 * - Inputs: requested shell route.
 * - Outputs: dialpad fallback when contact id is empty for detail/edit routes.
 */
export function applyShellNavigationTargetGuard(route: ShellRoute): ShellRoute {
  if (route.name === "contactDetails" || route.name === "contactEdit") {
    if (route.contactId.trim().length === 0) {
      return { name: "dialpad" };
    }
  }

  return route;
}
