import { describe, expect, it } from "vitest";
import {
  applyAuthorizationExecutionFailure,
  applyAuthorizationExecutionStage,
  applyAuthorizationProgressStage,
  clearAuthorizationProgress,
  initialAuthorizationProgressProjection,
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
    });
  });

  it("tracks completed execution stages and the exact timeout stage", () => {
    const token = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "requesting_authorization_token",
      "corr-stage",
    );
    const submit = applyAuthorizationExecutionStage(
      token,
      "submitting_token_to_ocp",
      "corr-stage",
    );
    const failed = applyAuthorizationExecutionFailure(submit, "timeout");

    expect(failed.completedExecutionStages).toEqual([
      "requesting_authorization_token",
    ]);
    expect(failed.failedExecutionStage).toBe("submitting_token_to_ocp");
    expect(failed.failureReason).toBe("timeout");
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
});
