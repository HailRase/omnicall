/**
 * - Purpose: decide whether the shell OCP sign-in progress overlay should open.
 * - Inputs: live authorization progress projection.
 * - Outputs: true for in-flight / latent / revealed failure attempts (not cold idle or settled ready).
 */

import type { AuthorizationProgressProjection } from "./authorizationProgressProjection.js";
import { deriveOcpSignInProgressView } from "./deriveOcpSignInProgressView.js";

/**
 * Pure gate for global OCP progress overlay. Ready success stays open only while
 * the UI holds its local flag until `onSuccessSettled`; this helper does not
 * force-open on settled ready alone.
 */
export function shouldOpenOcpSignInProgressModal(
  progress: AuthorizationProgressProjection,
  nowMs: number = Date.now(),
): boolean {
  const view = deriveOcpSignInProgressView(progress, nowMs);
  if (!view.isVisible) {
    return false;
  }
  if (view.isReady && !view.hasFailure && !view.hasLatentFailure) {
    return false;
  }
  return (
    view.overallState === "active" ||
    view.hasLatentFailure ||
    view.hasFailure
  );
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
