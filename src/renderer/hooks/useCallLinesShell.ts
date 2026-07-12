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
  incomingCallId: string | null = null,
): ReturnType<typeof deriveCallLinesShell> {
  return useMemo(
    () =>
      deriveCallLinesShell({
        multiLineCallProjection,
        multiCallProjection,
        activeCallControlsProjection,
        transferProjection,
        contacts,
        incomingCallId,
      }),
    [
      multiLineCallProjection,
      multiCallProjection,
      activeCallControlsProjection,
      transferProjection,
      contacts,
      incomingCallId,
    ],
  );
}
