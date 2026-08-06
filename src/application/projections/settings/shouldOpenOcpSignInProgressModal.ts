/**
 * - Purpose: decide whether the shell OCP sign-in progress overlay should open.
 * - Inputs: live authorization progress projection (`uiSurface` + stages).
 * - Outputs: true only for modal-surface in-flight / failure attempts (not cold idle,
 *   settled ready, or silent background transport recovery).
 */

import type { AuthorizationProgressProjection } from "./authorizationProgressProjection.js";
import { deriveOcpSignInProgressView } from "./deriveOcpSignInProgressView.js";

/**
 * Pure gate for global OCP progress overlay. Ready success stays open only while
 * the UI holds its local flag until `onSuccessSettled`; this helper does not
 * force-open on settled ready alone. Background transport recovery uses
 * `uiSurface: "silent"` and must not open the Dialog (banner only).
 */
export function shouldOpenOcpSignInProgressModal(
  progress: AuthorizationProgressProjection,
  nowMs: number = Date.now(),
): boolean {
  if (progress.uiSurface !== "modal") {
    return false;
  }
  const view = deriveOcpSignInProgressView(progress, nowMs);
  if (!view.isVisible) {
    return false;
  }
  if (view.isReady && !view.hasFailure) {
    return false;
  }
  return view.overallState === "active" || view.hasFailure;
}

export function isColdIdleAuthorizationProgress(
  progress: AuthorizationProgressProjection,
): boolean {
  return (
    progress.stage === "idle" &&
    progress.executionStage === null &&
    progress.failedExecutionStage === null &&
    progress.completedExecutionStages.length === 0 &&
    progress.correlationId === null
  );
}
