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

/**
 * - Purpose: derive call lines panel view-model from store projections.
 * - Inputs: multi-line, queue, controls, transfer projections, and contacts.
 * - Outputs: shell visibility, line rows, policy error message.
 */
export function useCallLinesShell(
  multiLineCallProjection: MultiLineCallProjection,
  multiCallProjection: MultiCallProjection,
  queueInfoProjection: QueueInfoProjection,
  activeCallControlsProjection: ActiveCallControlsProjection,
  transferProjection: TransferProjection,
  isOcpMode: boolean,
  contacts: ReadonlyArray<Contact>,
): ReturnType<typeof deriveCallLinesShell> {
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
