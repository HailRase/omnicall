import { useMemo } from "react";
import type { Contact } from "@application/index.js";
import {
  deriveCallLinesShell,
  type ActiveCallControlsProjection,
  type MultiCallProjection,
  type MultiLineCallProjection,
  type TransferProjection,
} from "@application/index.js";

export type CallLineRowShellInput = Readonly<{
  multiLineCallProjection: MultiLineCallProjection;
  multiCallProjection: MultiCallProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  transferProjection: TransferProjection;
  contacts: ReadonlyArray<Contact>;
  incomingCallId?: string | null;
}>;

/**
 * - Purpose: derive call line row shell view-model from store projections.
 * - Inputs: multi-line, controls, and transfer projections.
 * - Outputs: visible lines with labels, actions, and disabled reasons.
 */
export function useCallLineRowShell(
  input: CallLineRowShellInput,
): ReturnType<typeof deriveCallLinesShell> {
  const {
    multiLineCallProjection,
    multiCallProjection,
    activeCallControlsProjection,
    transferProjection,
    contacts,
    incomingCallId = null,
  } = input;

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
