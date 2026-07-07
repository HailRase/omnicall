import type { JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { useShellRouteDataLoader } from "./useShellRouteDataLoader.js";

type ShellRouteDataControllerProps = Readonly<{
  facade: AccountBootstrapFacade;
}>;

/**
 * - Purpose: mount route data lifecycle orchestration once per ready shell layout.
 * - Inputs: account bootstrap facade for contacts/history load actions.
 * - Outputs: invisible controller with no rendered UI.
 */
export function ShellRouteDataController({
  facade,
}: ShellRouteDataControllerProps): JSX.Element | null {
  useShellRouteDataLoader({ facade });
  return null;
}
