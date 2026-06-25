import type { TransferProjection } from "./transferProjection.js";
import { isBenignTransferFailureReason } from "./transferFailureReasons.js";

/**
 * - Purpose: decide whether transfer panel shell should render in the UI.
 * - Inputs: transfer and multi-line projection snapshots.
 * - Outputs: boolean visibility flag for presentational panel.
 */
export function isTransferPanelVisible(
  transferProjection: TransferProjection,
  multiLineCount: number,
): boolean {
  if (transferProjection.transferModeActive) {
    return true;
  }
  if (multiLineCount > 1) {
    return true;
  }
  return (
    transferProjection.phase === "transfer_failed" ||
    transferProjection.phase === "attended_transfer_failed"
  );
}

export function isTransferInProgress(transferProjection: TransferProjection): boolean {
  return (
    transferProjection.phase === "transferring" ||
    transferProjection.phase === "attended_transfer_in_progress"
  );
}

/**
 * - Purpose: map transfer failure reasons to user-visible banner copy.
 * - Inputs: transfer projection and multi-line failure reason.
 * - Outputs: formatted banner text or null when no failure should display.
 */
export function resolveTransferFailureMessage(
  transferProjection: TransferProjection,
  multiLineFailureReason: string | null,
): string | null {
  const transferReason = transferProjection.lastFailureReason;
  const reason = transferReason ?? multiLineFailureReason;
  if (reason === null || isBenignTransferFailureReason(reason)) {
    return null;
  }

  const prefix = resolveFailureBannerPrefix(transferProjection, multiLineFailureReason);
  return `${prefix}: ${reason}`;
}

function resolveFailureBannerPrefix(
  transferProjection: TransferProjection,
  multiLineFailureReason: string | null,
): string {
  if (
    transferProjection.phase === "transfer_failed" ||
    transferProjection.phase === "attended_transfer_failed"
  ) {
    return "Ошибка перевода";
  }

  if (transferProjection.lastFailureReason !== null) {
    return transferProjection.phase === "idle" ? "Ошибка консультации" : "Ошибка перевода";
  }

  if (multiLineFailureReason !== null) {
    return "Ошибка консультации";
  }

  return "Ошибка перевода";
}
