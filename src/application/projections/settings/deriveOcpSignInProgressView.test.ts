import { describe, expect, it } from "vitest";
import {
  applyAuthorizationExecutionFailure,
  applyAuthorizationExecutionStage,
  applyAuthorizationProgressStage,
  initialAuthorizationProgressProjection,
} from "./authorizationProgressProjection.js";
import { deriveOcpSignInProgressView } from "./deriveOcpSignInProgressView.js";

describe("deriveOcpSignInProgressView", () => {
  it("fills the active stage against its timeout window", () => {
    const progress = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "awaiting_authorization_data",
      "corr-1",
      0,
    );
    const view = deriveOcpSignInProgressView(progress, 15_000);

    expect(view.overallState).toBe("active");
    const active = view.stages.find(
      (stage) => stage.stage === "awaiting_authorization_data",
    );
    expect(active?.state).toBe("active");
    expect(active?.percent).toBe(50);
    expect(view.overallPercent).toBeGreaterThan(0);
  });

  it("keeps early failures blue until the stage timeout elapses", () => {
    const active = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "requesting_authorization_token",
      "corr-2",
      0,
    );
    const failed = applyAuthorizationExecutionFailure(active, {
      reason: "failed",
      failureKind: "http_failed",
      failureCode: "Failed to fetch",
    });
    const duringWindow = deriveOcpSignInProgressView(failed, 5_000);
    const stage = duringWindow.stages.find(
      (entry) => entry.stage === "requesting_authorization_token",
    );

    expect(duringWindow.hasLatentFailure).toBe(true);
    expect(duringWindow.hasFailure).toBe(false);
    expect(duringWindow.overallState).toBe("active");
    expect(stage?.state).toBe("active");
    expect(stage?.percent).toBeCloseTo((5_000 / 15_000) * 100);
    expect(stage?.awaitingTimeoutReveal).toBe(true);
  });

  it("reveals timeout failure after the stage timeout window for network errors", () => {
    const active = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "submitting_token_to_ocp",
      "corr-3",
      0,
    );
    const failed = applyAuthorizationExecutionFailure(active, {
      reason: "failed",
      failureKind: "transport",
      failureCode: "Failed to fetch",
    });
    const view = deriveOcpSignInProgressView(failed, 15_000);

    expect(view.hasFailure).toBe(true);
    expect(view.overallState).toBe("failed");
    const stage = view.stages.find(
      (entry) => entry.stage === "submitting_token_to_ocp",
    );
    expect(stage?.state).toBe("failed");
    expect(stage?.failureKind).toBe("timeout");
    expect(stage?.failureCode).toBe("Failed to fetch");
    expect(stage?.percent).toBe(100);
  });

  it("reveals SESSION_EXIST immediately without waiting for timeout", () => {
    const active = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "requesting_authorization_token",
      "corr-session",
      Date.now(),
    );
    const failed = applyAuthorizationExecutionFailure(active, {
      reason: "failed",
      failureKind: "session_exist",
      failureCode: "ocp_session_exist",
    });
    const view = deriveOcpSignInProgressView(failed, Date.now());

    expect(view.hasFailure).toBe(true);
    expect(view.hasLatentFailure).toBe(false);
    expect(view.overallState).toBe("failed");
    const stage = view.stages.find(
      (entry) => entry.stage === "requesting_authorization_token",
    );
    expect(stage?.state).toBe("failed");
    expect(stage?.failureKind).toBe("session_exist");
    expect(stage?.failureCode).toBe("ocp_session_exist");
  });

  it("completes all stages when ready", () => {
    const ready = applyAuthorizationProgressStage(
      initialAuthorizationProgressProjection(),
      "ready",
      "corr-4",
    );
    const view = deriveOcpSignInProgressView(ready, 0);

    expect(view.isReady).toBe(true);
    expect(view.overallState).toBe("completed");
    expect(view.overallPercent).toBe(100);
    expect(view.stages.every((stage) => stage.state === "completed")).toBe(true);
  });
});
