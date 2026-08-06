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
    const view = deriveOcpSignInProgressView(progress, 7_500);

    expect(view.overallState).toBe("active");
    const active = view.stages.find(
      (stage) => stage.stage === "awaiting_authorization_data",
    );
    expect(active?.state).toBe("active");
    expect(active?.percent).toBe(50);
    expect(view.overallPercent).toBeGreaterThan(0);
  });

  it("reveals network failures immediately with the real failure kind", () => {
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
    const view = deriveOcpSignInProgressView(failed, 5_000);
    const stage = view.stages.find(
      (entry) => entry.stage === "requesting_authorization_token",
    );

    expect(view.hasFailure).toBe(true);
    expect(view.overallState).toBe("failed");
    expect(stage?.state).toBe("failed");
    expect(stage?.percent).toBe(100);
    expect(stage?.failureKind).toBe("http_failed");
    expect(stage?.failureCode).toBe("Failed to fetch");
  });

  it("maps timeout failure kinds to the timeout visual state", () => {
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
    const view = deriveOcpSignInProgressView(failed, 1_000);
    const stage = view.stages.find(
      (entry) => entry.stage === "submitting_token_to_ocp",
    );

    expect(view.hasFailure).toBe(true);
    expect(stage?.state).toBe("failed");
    expect(stage?.failureKind).toBe("transport");
    expect(stage?.failureCode).toBe("Failed to fetch");
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
    expect(view.overallState).toBe("failed");
    const stage = view.stages.find(
      (entry) => entry.stage === "requesting_authorization_token",
    );
    expect(stage?.state).toBe("failed");
    expect(stage?.failureKind).toBe("session_exist");
    expect(stage?.failureCode).toBe("ocp_session_exist");
  });

  it("uses timeout visual state for auth/credentials timeouts", () => {
    const active = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "receiving_phone_credentials",
      "corr-creds",
      0,
    );
    const failed = applyAuthorizationExecutionFailure(active, {
      reason: "timeout",
      failureKind: "credentials_timeout",
      failureCode: "ocp_credentials_timeout",
    });
    const view = deriveOcpSignInProgressView(failed, 1_000);
    const stage = view.stages.find(
      (entry) => entry.stage === "receiving_phone_credentials",
    );
    expect(stage?.state).toBe("timeout");
    expect(stage?.failureKind).toBe("credentials_timeout");
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

  it("shows active token stage after reconnecting from a ready checklist", () => {
    const ready = applyAuthorizationProgressStage(
      initialAuthorizationProgressProjection(),
      "ready",
      "corr-ready",
    );
    const token = applyAuthorizationExecutionStage(
      ready,
      "requesting_authorization_token",
      "corr-reconnect",
      0,
    );
    const view = deriveOcpSignInProgressView(token, 7_500);
    const active = view.stages.find(
      (entry) => entry.stage === "requesting_authorization_token",
    );

    expect(view.overallState).toBe("active");
    expect(active?.state).toBe("active");
    expect(active?.percent).toBe(50);
    // Fresh attempt clears stale ready checklist — only the active stage is in flight.
    expect(
      view.stages.filter((entry) => entry.state === "completed"),
    ).toHaveLength(0);
    expect(
      view.stages.filter((entry) => entry.state === "pending"),
    ).toHaveLength(5);
  });
});

