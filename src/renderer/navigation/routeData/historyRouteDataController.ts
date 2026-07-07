import type { ParsedShellRoute } from "../shellRouteModel.js";

export type HistoryRouteLoadTarget =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "list" }>;

/**
 * - Purpose: derive history route load intent from parsed shell routes.
 * - Inputs: parsed shell route.
 * - Outputs: history list load target without side effects.
 */
export function resolveHistoryRouteLoadTarget(route: ParsedShellRoute): HistoryRouteLoadTarget {
  if (route.name === "history") {
    return { kind: "list" };
  }

  return { kind: "none" };
}

export function shouldStartHistoryListLoad(input: Readonly<{
  inFlight: boolean;
}>): boolean {
  return !input.inFlight;
}
