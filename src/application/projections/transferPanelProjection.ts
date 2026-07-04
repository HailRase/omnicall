import type { TransferProjection } from "./transferProjection.js";
import { isBenignTransferFailureReason } from "./transferFailureReasons.js";

export type TransferPanelVisibilityContext = Readonly<{
  attendedPhase: string;
  consultationCallId: string | null;
}>;

/**
 * - Purpose: decide whether transfer panel shell should render in the UI.
 * - Inputs: transfer projection and attended-transfer multi-line context.
 * - Outputs: boolean visibility flag for presentational panel.
 */
export function isTransferPanelVisible(
  transferProjection: TransferProjection,
  multiLineContext: TransferPanelVisibilityContext,
): boolean {
  if (transferProjection.transferModeActive) {
    return true;
  }
  if (multiLineContext.consultationCallId !== null) {
    return true;
  }
  if (multiLineContext.attendedPhase !== "idle") {
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

export type TransferFailureBanner = Readonly<{
  title:
    | "transfer.failure.title.transferFailed"
    | "transfer.failure.title.consultationFailed";
  detail: string;
}>;

export type TransferFailureMessageDescriptor = Readonly<{
  key: "transfer.failure.message";
  params: Readonly<{
    titleKey: TransferFailureBanner["title"];
    detail: string;
  }>;
}>;

/**
 * - Purpose: map transfer failure reasons to user-visible banner copy.
 * - Inputs: transfer projection and multi-line failure reason.
 * - Outputs: formatted banner text or null when no failure should display.
 */
export function resolveTransferFailureMessage(
  transferProjection: TransferProjection,
  multiLineFailureReason: string | null,
): TransferFailureMessageDescriptor | null {
  const banner = resolveTransferFailureBanner(transferProjection, multiLineFailureReason);
  if (banner === null) {
    return null;
  }
  return {
    key: "transfer.failure.message",
    params: {
      titleKey: banner.title,
      detail: banner.detail,
    },
  };
}

/**
 * - Purpose: split transfer failure banner into title and detail for panel rendering.
 * - Inputs: transfer projection and multi-line failure reason.
 * - Outputs: banner title/detail pair or null when failure should stay hidden.
 */
export function resolveTransferFailureBanner(
  transferProjection: TransferProjection,
  multiLineFailureReason: string | null,
): TransferFailureBanner | null {
  const transferReason = transferProjection.lastFailureReason;
  const reason = transferReason ?? multiLineFailureReason;
  if (reason === null || isBenignTransferFailureReason(reason)) {
    return null;
  }

  const title = resolveFailureBannerPrefix(transferProjection, multiLineFailureReason);
  return { title, detail: reason };
}

function resolveFailureBannerPrefix(
  transferProjection: TransferProjection,
  multiLineFailureReason: string | null,
): TransferFailureBanner["title"] {
  if (
    transferProjection.phase === "transfer_failed" ||
    transferProjection.phase === "attended_transfer_failed"
  ) {
    return "transfer.failure.title.transferFailed";
  }

  if (transferProjection.lastFailureReason !== null) {
    return transferProjection.phase === "idle"
      ? "transfer.failure.title.consultationFailed"
      : "transfer.failure.title.transferFailed";
  }

  if (multiLineFailureReason !== null) {
    return "transfer.failure.title.consultationFailed";
  }

  return "transfer.failure.title.transferFailed";
}
