import { useMemo } from "react";
import {
  deriveCallLinesShell,
  type MultiCallProjection,
  type MultiLineCallProjection,
} from "@application/index.js";

/**
 * - Purpose: derive call lines panel view-model from store projections.
 * - Inputs: multi-line and multi-call projections.
 * - Outputs: shell visibility, line cards, policy error message.
 */
export function useCallLinesShell(
  multiLineCallProjection: MultiLineCallProjection,
  multiCallProjection: MultiCallProjection,
): ReturnType<typeof deriveCallLinesShell> {
  return useMemo(
    () => deriveCallLinesShell(multiLineCallProjection, multiCallProjection),
    [multiLineCallProjection, multiCallProjection],
  );
}
