/**
 * - Purpose: on INVALID_TOKEN, trigger one Application-layer HTTP re-auth (not WS reconnect).
 * - Inputs: OCP projection authFeedback + reauthenticate callback (Facade.connectOcp).
 * - Outputs: single capped auto re-auth attempt; further retries remain manual.
 */

import type { Logger } from "@ports/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import type { OcpProjectionHub } from "../../read-models/OcpProjectionHub.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

export type OcpInvalidTokenReauthServiceDeps = Readonly<{
  projectionHub: OcpProjectionHub;
  reauthenticate: () => Promise<Result<void, PlatformError>>;
  logger: Logger;
}>;

/**
 * Watches authFeedback for INVALID_TOKEN and routes recovery through HTTP authenticate
 * via Application orchestration. Does not reopen the WebSocket with a stale token.
 */
export class OcpInvalidTokenReauthService {
  private unsubscribe: (() => void) | null = null;
  private lastHandledNonce = 0;
  private inFlight = false;
  private autoAttempts = 0;
  private readonly maxAutoAttempts = 1;
  private wasAuthorized = false;

  constructor(private readonly deps: OcpInvalidTokenReauthServiceDeps) {
    this.unsubscribe = deps.projectionHub.subscribe(() => {
      this.resetBudgetAfterNewAuthorizedSession();
      void this.maybeReauthenticate();
    });
  }

  dispose(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  private resetBudgetAfterNewAuthorizedSession(): void {
    const isAuthorized =
      this.deps.projectionHub.getSessionProjection().authorizationState.phase ===
      "authorized";
    if (isAuthorized && !this.wasAuthorized) {
      this.autoAttempts = 0;
    }
    this.wasAuthorized = isAuthorized;
  }

  private async maybeReauthenticate(): Promise<void> {
    const feedback = this.deps.projectionHub.getSessionProjection().authFeedback;
    if (feedback === null || feedback.reason !== "INVALID_TOKEN") {
      return;
    }
    if (feedback.nonce === this.lastHandledNonce) {
      return;
    }
    if (this.inFlight || this.autoAttempts >= this.maxAutoAttempts) {
      return;
    }

    this.lastHandledNonce = feedback.nonce;
    this.autoAttempts += 1;
    this.inFlight = true;

    this.deps.logger.info("ocp_invalid_token_http_reauth_requested", {
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_invalid_token_reauth",
      result: "requested",
      attempt: this.autoAttempts,
    });

    try {
      const result = await this.deps.reauthenticate();
      this.deps.logger.info("ocp_invalid_token_http_reauth_completed", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_invalid_token_reauth",
        result: result.ok ? "succeeded" : result.error.message,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown_error";
      this.deps.logger.error("ocp_invalid_token_http_reauth_threw", {
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_invalid_token_reauth",
        result: message,
      });
    } finally {
      this.inFlight = false;
    }
  }
}
