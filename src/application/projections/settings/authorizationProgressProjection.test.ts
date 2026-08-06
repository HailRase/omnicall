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
    expect(ready.completedExecutionStages).toHaveLength(6);

    const preparing = applyAuthorizationProgressStage(ready, "preparing", "corr-2");
    expect(preparing.stage).toBe("preparing");
    expect(preparing.completedExecutionStages).toEqual([]);
    expect(preparing.executionStage).toBeNull();
  });

  it("clears a stale ready checklist when restarting at the first stage", () => {
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
    expect(token.executionStage).toBe("requesting_authorization_token");
    expect(token.completedExecutionStages).toEqual([]);
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

  it("marks skipped prefix stages completed when jumping ahead to SIP transport", () => {
    const awaiting = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "awaiting_authorization_data",
      "corr-early",
      1_000,
    );
    const sip = applyAuthorizationExecutionStage(
      awaiting,
      "connecting_sip_transport",
      "corr-early",
      2_000,
    );

    expect(sip.executionStage).toBe("connecting_sip_transport");
    expect(sip.completedExecutionStages).toEqual([
      "requesting_authorization_token",
      "submitting_token_to_ocp",
      "awaiting_authorization_data",
      "receiving_phone_credentials",
    ]);
  });

  it("does not regress from SIP transport back to receiving credentials", () => {
    const sip = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "connecting_sip_transport",
      "corr-sip",
      1_000,
    );
    const regress = applyAuthorizationExecutionStage(
      sip,
      "receiving_phone_credentials",
      "corr-late",
      2_000,
    );

    expect(regress).toBe(sip);
    expect(regress.executionStage).toBe("connecting_sip_transport");
    expect(regress.stageStartedAtMs).toBe(1_000);
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
    expect(progressed.completedExecutionStages).toHaveLength(6);
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
