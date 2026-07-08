import { useMemo } from "react";
import type { Contact } from "@domain/index.js";
import {
  deriveCallLinesShell,
  type ActiveCallControlsProjection,
  type MultiCallProjection,
  type MultiLineCallProjection,
  type QueueInfoProjection,
  type TransferProjection,
} from "@application/index.js";

export type CallLineRowShellInput = Readonly<{
  multiLineCallProjection: MultiLineCallProjection;
  multiCallProjection: MultiCallProjection;
  queueInfoProjection: QueueInfoProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  transferProjection: TransferProjection;
  isOcpMode: boolean;
  contacts: ReadonlyArray<Contact>;
}>;

/**
 * - Purpose: derive call line row shell view-model from store projections.
 * - Inputs: multi-line, queue, controls, and transfer projections.
 * - Outputs: visible lines with labels, actions, and disabled reasons.
 */
export function useCallLineRowShell(
  input: CallLineRowShellInput,
): ReturnType<typeof deriveCallLinesShell> {
  const {
    multiLineCallProjection,
    multiCallProjection,
    queueInfoProjection,
    activeCallControlsProjection,
    transferProjection,
    isOcpMode,
    contacts,
  } = input;

  return useMemo(
    () =>
      deriveCallLinesShell({
        multiLineCallProjection,
        multiCallProjection,
        queueInfoProjection,
        activeCallControlsProjection,
        transferProjection,
        isOcpMode,
        contacts,
      }),
    [
      multiLineCallProjection,
      multiCallProjection,
      queueInfoProjection,
      activeCallControlsProjection,
      transferProjection,
      isOcpMode,
      contacts,
    ],
  );
}
