import { describe, expect, it } from "vitest";
import {
  applyAuthorizationExecutionFailure,
  applyAuthorizationExecutionStage,
  applyAuthorizationProgressStage,
  clearAuthorizationProgress,
  initialAuthorizationProgressProjection,
  mapAuthorizationFailureKind,
  mapAuthorizationFailureStage,
} from "./authorizationProgressProjection.js";

describe("authorizationProgressProjection", () => {
  it("starts idle without retry", () => {
    expect(initialAuthorizationProgressProjection()).toEqual({
      stage: "idle",
      retryAvailable: false,
      correlationId: null,
      executionStage: null,
      completedExecutionStages: [],
      failedExecutionStage: null,
      failureReason: null,
      failureKind: null,
      failureCode: null,
      stageStartedAtMs: null,
      uiSurface: "modal",
    });
  });

  it("clears completed stages when preparing a new attempt", () => {
    const ready = applyAuthorizationProgressStage(
      initialAuthorizationProgressProjection(),
      "ready",
      "corr-ready",
    );
    expect(ready.completedExecutionStages).toHaveLength(5);

    const preparing = applyAuthorizationProgressStage(ready, "preparing", "corr-2");
    expect(preparing.stage).toBe("preparing");
    expect(preparing.completedExecutionStages).toEqual([]);
    expect(preparing.executionStage).toBeNull();
  });

  it("removes the active stage from a stale completed checklist", () => {
    const ready = applyAuthorizationProgressStage(
      initialAuthorizationProgressProjection(),
      "ready",
      "corr-ready",
    );
    const token = applyAuthorizationExecutionStage(
      ready,
      "requesting_authorization_token",
      "corr-reconnect",
      1_000,
    );
    expect(token.completedExecutionStages).not.toContain(
      "requesting_authorization_token",
    );
    expect(token.executionStage).toBe("requesting_authorization_token");
  });

  it("tracks completed execution stages and the exact timeout stage", () => {
    const token = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "requesting_authorization_token",
      "corr-stage",
      1_000,
    );
    const submit = applyAuthorizationExecutionStage(
      token,
      "submitting_token_to_ocp",
      "corr-stage",
      2_000,
    );
    const failed = applyAuthorizationExecutionFailure(submit, {
      reason: "timeout",
      failureKind: "timeout",
      failureCode: "ocp_auth_timeout",
    });

    expect(failed.completedExecutionStages).toEqual([
      "requesting_authorization_token",
    ]);
    expect(failed.failedExecutionStage).toBe("submitting_token_to_ocp");
    expect(failed.failureReason).toBe("timeout");
    expect(failed.failureKind).toBe("timeout");
    expect(failed.failureCode).toBe("ocp_auth_timeout");
    expect(failed.stageStartedAtMs).toBe(2_000);
  });

  it("marks retry on failure stages", () => {
    const next = applyAuthorizationProgressStage(
      initialAuthorizationProgressProjection(),
      "sip_registration_failed",
      "corr-1",
    );
    expect(next.retryAvailable).toBe(true);
    expect(next.correlationId).toBe("corr-1");
  });

  it("clears progress", () => {
    const progressed = applyAuthorizationProgressStage(
      initialAuthorizationProgressProjection(),
      "ready",
      "corr-2",
    );
    expect(clearAuthorizationProgress()).toEqual(
      initialAuthorizationProgressProjection(),
    );
    expect(progressed.stage).toBe("ready");
    expect(progressed.completedExecutionStages).toHaveLength(5);
  });

  it("maps failure reasons to stages", () => {
    expect(mapAuthorizationFailureStage("ocp_session_exist")).toBe(
      "ocp_session_exist",
    );
    expect(mapAuthorizationFailureStage("ocp_credentials_timeout")).toBe(
      "ocp_unavailable",
    );
    expect(mapAuthorizationFailureStage("ocp_sip_register_failed")).toBe(
      "sip_registration_failed",
    );
    expect(mapAuthorizationFailureStage("ocp_sip_identity_mismatch")).toBe(
      "ocp_connected_sip_failed",
    );
  });

  it("maps failure codes to kinds", () => {
    expect(mapAuthorizationFailureKind("ocp_session_exist")).toBe("session_exist");
    expect(mapAuthorizationFailureKind("ocp_auth_timeout")).toBe("timeout");
    expect(mapAuthorizationFailureKind("http_404")).toBe("http_failed");
    expect(mapAuthorizationFailureKind("Invalid PROXY_API_KEY")).toBe(
      "invalid_api_key",
    );
    expect(mapAuthorizationFailureKind("ocp_sip_register_failed")).toBe(
      "sip_register_failed",
    );
  });
});
