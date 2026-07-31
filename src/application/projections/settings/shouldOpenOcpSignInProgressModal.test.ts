import { describe, expect, it } from "vitest";
import {
  applyAuthorizationExecutionFailure,
  applyAuthorizationExecutionStage,
  applyAuthorizationProgressStage,
  initialAuthorizationProgressProjection,
  withAuthorizationProgressUiSurface,
} from "./authorizationProgressProjection.js";
import {
  isColdIdleAuthorizationProgress,
  shouldOpenOcpSignInProgressModal,
} from "./shouldOpenOcpSignInProgressModal.js";

describe("shouldOpenOcpSignInProgressModal", () => {
  it("returns false for cold idle", () => {
    expect(
      shouldOpenOcpSignInProgressModal(initialAuthorizationProgressProjection()),
    ).toBe(false);
    expect(
      isColdIdleAuthorizationProgress(initialAuthorizationProgressProjection()),
    ).toBe(true);
  });

  it("returns false for silent background transport recovery", () => {
    const progress = withAuthorizationProgressUiSurface(
      applyAuthorizationExecutionStage(
        initialAuthorizationProgressProjection(),
        "requesting_authorization_token",
        "transport-recovery-1",
      ),
      "silent",
    );
    expect(shouldOpenOcpSignInProgressModal(progress)).toBe(false);
  });

  it("returns true while an execution stage is active", () => {
    const progress = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "requesting_authorization_token",
      "attempt-1",
      Date.now(),
    );
    expect(shouldOpenOcpSignInProgressModal(progress)).toBe(true);
  });

  it("returns true for revealed stage failure", () => {
    const active = applyAuthorizationExecutionStage(
      initialAuthorizationProgressProjection(),
      "submitting_token_to_ocp",
      "attempt-1",
      Date.now() - 20_000,
    );
    const failed = applyAuthorizationExecutionFailure(active, {
      reason: "timeout",
      failureKind: "timeout",
      failureCode: "ocp_auth_timeout",
    });
    expect(shouldOpenOcpSignInProgressModal(failed)).toBe(true);
  });

  it("returns false for settled ready without failure", () => {
    const ready = applyAuthorizationProgressStage(
      applyAuthorizationExecutionStage(
        initialAuthorizationProgressProjection(),
        "authorizing_sip",
        "attempt-1",
        Date.now(),
      ),
      "ready",
      "attempt-1",
    );
    expect(shouldOpenOcpSignInProgressModal(ready)).toBe(false);
  });
});
