import type {
  ActiveCallControlsProjection,
  TransferProjection,
} from "@application/index.js";
import { deriveStartTransferDisabledReason } from "./transferProjection.js";

export type ActiveCallControlsShell = Readonly<{
  transferDisabledReason: string | null;
}>;

/**
 * - Purpose: derive active call controls shell fields from telephony projections.
 * - Inputs: active call controls and transfer projections.
 * - Outputs: transfer button disabled reason for UI.
 */
export function deriveActiveCallControlsShell(
  activeCallControlsProjection: ActiveCallControlsProjection,
  transferProjection: TransferProjection,
): ActiveCallControlsShell {
  return {
    transferDisabledReason: deriveStartTransferDisabledReason({
      activeCallId: activeCallControlsProjection.callId,
      activeCallState: activeCallControlsProjection.callState,
      transferModeActive: transferProjection.transferModeActive,
    }),
  };
}
