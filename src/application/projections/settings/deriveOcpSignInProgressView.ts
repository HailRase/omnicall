/**
 * - Purpose: derive timed OCP sign-in progress bars for Account modal UI.
 * - Inputs: authorization progress projection + wall clock + stage timeouts.
 * - Outputs: per-stage and overall percent/tone without React ownership.
 *
 * Terminal failures reveal immediately (real failureKind preserved). Progress bars
 * only animate while a stage is still in flight — never after failedExecutionStage.
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
  | "failed"
  | "timeout";

export type OcpSignInStageProgressView = Readonly<{
  stage: OcpSignInExecutionStage;
  state: OcpSignInStageVisualState;
  percent: number;
  timeoutMs: number;
  failureKind: AuthorizationProgressFailureKind | null;
  failureCode: string | null;
}>;

export type OcpSignInProgressView = Readonly<{
  stages: ReadonlyArray<OcpSignInStageProgressView>;
  overallPercent: number;
  overallState: "idle" | "active" | "completed" | "failed";
  hasFailure: boolean;
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

function resolveFailedVisualState(
  failureKind: AuthorizationProgressFailureKind | null,
): Extract<OcpSignInStageVisualState, "failed" | "timeout"> {
  if (failureKind === "timeout" || failureKind === "credentials_timeout") {
    return "timeout";
  }
  return "failed";
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

  let hasRevealedFailure = false;

  const stages = OCP_SIGN_IN_EXECUTION_STAGES.map(
    (stage): OcpSignInStageProgressView => {
      const timeoutMs = OCP_SIGN_IN_STAGE_TIMEOUT_MS[stage];
      const failed = progress.failedExecutionStage === stage;
      const completed = progress.completedExecutionStages.includes(stage);
      const active = progress.executionStage === stage && !failed;

      if (failed) {
        hasRevealedFailure = true;
        return {
          stage,
          state: resolveFailedVisualState(progress.failureKind),
          percent: 100,
          timeoutMs,
          failureKind: progress.failureKind,
          failureCode: progress.failureCode,
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
        };
      }

      return {
        stage,
        state: "pending",
        percent: 0,
        timeoutMs,
        failureKind: null,
        failureCode: null,
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
    isReady,
    isVisible,
  };
}
