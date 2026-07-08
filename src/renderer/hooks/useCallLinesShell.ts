import { useMemo } from "react";
import type { Contact } from "@application/index.js";
import {
  deriveCallLinesShell,
  type ActiveCallControlsProjection,
  type MultiCallProjection,
  type MultiLineCallProjection,
  type TransferProjection,
} from "@application/index.js";

/**
 * - Purpose: derive call lines panel view-model from store projections.
 * - Inputs: multi-line, controls, transfer projections, and contacts.
 * - Outputs: shell visibility, line rows, policy error message.
 */
export function useCallLinesShell(
  multiLineCallProjection: MultiLineCallProjection,
  multiCallProjection: MultiCallProjection,
  activeCallControlsProjection: ActiveCallControlsProjection,
  transferProjection: TransferProjection,
  contacts: ReadonlyArray<Contact>,
): ReturnType<typeof deriveCallLinesShell> {
  return useMemo(
    () =>
      deriveCallLinesShell({
        multiLineCallProjection,
        multiCallProjection,
        activeCallControlsProjection,
        transferProjection,
        contacts,
      }),
    [
      multiLineCallProjection,
      multiCallProjection,
      activeCallControlsProjection,
      transferProjection,
      contacts,
    ],
  );
}
