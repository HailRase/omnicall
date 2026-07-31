/**
 * - Purpose: derive timed OCP sign-in progress bars for Account modal UI.
 * - Inputs: authorization progress projection + wall clock + stage timeouts.
 * - Outputs: per-stage and overall percent/tone without React ownership.
 *
 * Early transport/network failures keep the active (blue) fill until the stage
 * timeout window elapses; only then the stage is revealed as failed/timeout.
 */

import {
  OCP_SIGN_IN_EXECUTION_STAGES,
  OCP_SIGN_IN_STAGE_TIMEOUT_MS,
  type OcpSignInExecutionStage,
} from "@domain/index.js";
import type {
  AuthorizationProgressFailureKind,
  AuthorizationProgressProjection,
} from "./authorizationProgressProjection.js";

export type OcpSignInStageVisualState =
  | "pending"
  | "active"
  | "completed"
  | "failed";

export type OcpSignInStageProgressView = Readonly<{
  stage: OcpSignInExecutionStage;
  state: OcpSignInStageVisualState;
  percent: number;
  timeoutMs: number;
  failureKind: AuthorizationProgressFailureKind | null;
  failureCode: string | null;
  /** Projection already failed, but UI still fills blue until timeout. */
  awaitingTimeoutReveal: boolean;
}>;

export type OcpSignInProgressView = Readonly<{
  stages: ReadonlyArray<OcpSignInStageProgressView>;
  overallPercent: number;
  overallState: "idle" | "active" | "completed" | "failed";
  /** True only after a failure is revealed (timeout window elapsed). */
  hasFailure: boolean;
  /** Projection failed but bar is still animating to timeout. */
  hasLatentFailure: boolean;
  isReady: boolean;
  isVisible: boolean;
}>;

function clampPercent(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 100) {
    return 100;
  }
  return value;
}

function resolveActivePercent(
  stageStartedAtMs: number | null,
  timeoutMs: number,
  nowMs: number,
): number {
  if (stageStartedAtMs === null || timeoutMs <= 0) {
    return 0;
  }
  const elapsed = Math.max(0, nowMs - stageStartedAtMs);
  return clampPercent((elapsed / timeoutMs) * 100);
}

function hasElapsedTimeoutWindow(
  stageStartedAtMs: number | null,
  timeoutMs: number,
  nowMs: number,
): boolean {
  if (stageStartedAtMs === null || timeoutMs <= 0) {
    return true;
  }
  return nowMs - stageStartedAtMs >= timeoutMs;
}

/**
 * Definitive server answers (HTTP 200 SESSION_EXIST, invalid API key, …)
 * must surface immediately — the request already completed successfully.
 * Network/transport drops still wait out the stage timeout bar.
 */
function shouldRevealFailureImmediately(
  failureKind: AuthorizationProgressFailureKind | null,
): boolean {
  return (
    failureKind === "session_exist" ||
    failureKind === "invalid_api_key" ||
    failureKind === "sip_identity_mismatch" ||
    failureKind === "sip_authorize_failed" ||
    failureKind === "sip_register_failed" ||
    failureKind === "cancelled"
  );
}

/**
 * Pure view of OCP sign-in progress for modal rendering / tests.
 */
export function deriveOcpSignInProgressView(
  progress: AuthorizationProgressProjection,
  nowMs: number = Date.now(),
): OcpSignInProgressView {
  const projectionFailed = progress.failedExecutionStage !== null;
  const isReady = progress.stage === "ready";
  const isVisible =
    progress.executionStage !== null ||
    progress.completedExecutionStages.length > 0 ||
    projectionFailed ||
    isReady;

  let hasLatentFailure = false;
  let hasRevealedFailure = false;

  const stages = OCP_SIGN_IN_EXECUTION_STAGES.map(
    (stage): OcpSignInStageProgressView => {
      const timeoutMs = OCP_SIGN_IN_STAGE_TIMEOUT_MS[stage];
      const failed = progress.failedExecutionStage === stage;
      const completed = progress.completedExecutionStages.includes(stage);
      const active = progress.executionStage === stage && !failed;

      if (failed) {
        const immediate = shouldRevealFailureImmediately(progress.failureKind);
        const reveal =
          immediate ||
          hasElapsedTimeoutWindow(
            progress.stageStartedAtMs,
            timeoutMs,
            nowMs,
          );
        if (!reveal) {
          hasLatentFailure = true;
          return {
            stage,
            state: "active",
            percent: resolveActivePercent(
              progress.stageStartedAtMs,
              timeoutMs,
              nowMs,
            ),
            timeoutMs,
            failureKind: null,
            failureCode: null,
            awaitingTimeoutReveal: true,
          };
        }
        hasRevealedFailure = true;
        // Immediate server answers keep their real kind; latent network waits
        // become timeout after the bar finishes.
        return {
          stage,
          state: "failed",
          percent: 100,
          timeoutMs,
          failureKind: immediate
            ? progress.failureKind
            : "timeout",
          failureCode: progress.failureCode,
          awaitingTimeoutReveal: false,
        };
      }

      // Active must win over a stale completed checklist from a prior ready run.
      if (active) {
        return {
          stage,
          state: "active",
          percent: resolveActivePercent(
            progress.stageStartedAtMs,
            timeoutMs,
            nowMs,
          ),
          timeoutMs,
          failureKind: null,
          failureCode: null,
          awaitingTimeoutReveal: false,
        };
      }

      if (completed || (isReady && !projectionFailed)) {
        return {
          stage,
          state: "completed",
          percent: 100,
          timeoutMs,
          failureKind: null,
          failureCode: null,
          awaitingTimeoutReveal: false,
        };
      }

      return {
        stage,
        state: "pending",
        percent: 0,
        timeoutMs,
        failureKind: null,
        failureCode: null,
        awaitingTimeoutReveal: false,
      };
    },
  );

  const stageWeight = 100 / stages.length;
  const overallPercent = clampPercent(
    stages.reduce((sum, stageView) => sum + (stageView.percent / 100) * stageWeight, 0),
  );

  let overallState: OcpSignInProgressView["overallState"] = "idle";
  if (hasRevealedFailure) {
    overallState = "failed";
  } else if (isReady || stages.every((stageView) => stageView.state === "completed")) {
    overallState = "completed";
  } else if (
    stages.some(
      (stageView) =>
        stageView.state === "active" || stageView.state === "completed",
    )
  ) {
    overallState = "active";
  }

  return {
    stages,
    overallPercent,
    overallState,
    hasFailure: hasRevealedFailure,
    hasLatentFailure,
    isReady,
    isVisible,
  };
}
