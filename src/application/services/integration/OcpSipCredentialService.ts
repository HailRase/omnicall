/**
 * - Purpose: apply SIP account from OCP `creds` (orchestrated wait or opportunistic).
 * - Inputs: OCP gateway creds entity + SIP registration/identity guards + correlationId.
 * - Outputs: AuthorizeSipAccount + RegisterAccount with typed apply result (no password logs).
 *
 * Cancellation model (no unsafe Promise abort):
 * - `cancelWait` / `cancelInFlightApplies` bump `applyEpoch`.
 * - Checkpoints after each await skip promote/register/progress when epoch changed.
 * - Non-cancellable boundary: once `promoteAuthorizedSipSession` has resolved ok,
 *   account session stays (ADR-AF-005); we still skip register if cancelled mid-promote await.
 */

import { matchesSipAccountIdentity } from "@domain/index.js";
import type { SettingsAccountIdentity } from "@domain/settings/deriveSettingsAccountKey.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { Logger } from "@ports/index.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import {
  OCP_SIGN_IN_STAGE_TIMEOUT_MS,
  type OcpSignInExecutionStage,
} from "@domain/index.js";
import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { AuthorizeSipAccountUseCase } from "../../use-cases/settings/AuthorizeSipAccountUseCase.js";
import type { PromoteAuthorizedSipSessionUseCase } from "../../use-cases/settings/PromoteAuthorizedSipSessionUseCase.js";
import type { RegisterAccountUseCase } from "../../use-cases/settings/RegisterAccountUseCase.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

/** Wait for OCP `creds` after authenticated before surfacing timeout. */
export const OCP_CREDENTIALS_TIMEOUT_MS = 15_000;

export type OcpSipCredentialsPayload = Readonly<{
  username: string;
  password: string;
  domain: string;
  server: string;
}>;

export type OcpSipCredentialApplyOutcome =
  | Readonly<{ kind: "applied" }>
  | Readonly<{ kind: "already_matching" }>
  | Readonly<{ kind: "identity_mismatch" }>
  | Readonly<{ kind: "cancelled" }>
  | Readonly<{ kind: "authorize_failed"; error: PlatformError }>
  | Readonly<{ kind: "register_failed"; error: PlatformError }>;

export type OcpSipCredentialServiceDeps = Readonly<{
  ocpGateway: OcpGateway;
  logger: Logger;
  authorizeSipAccount: Pick<AuthorizeSipAccountUseCase, "execute">;
  registerAccount: Pick<RegisterAccountUseCase, "execute">;
  promoteAuthorizedSipSession: Pick<PromoteAuthorizedSipSessionUseCase, "execute">;
  isSipRegistered: () => boolean;
  getActiveSipIdentity: () => Promise<SettingsAccountIdentity | null>;
  credentialsTimeoutMs?: number;
  /** Optional progress hook when authorize+register begins. */
  onRegisteringPhone?: (correlationId: CorrelationId) => void;
  onExecutionStage?: (
    stage: OcpSignInExecutionStage,
    correlationId: CorrelationId,
  ) => void;
}>;

type PendingWaiter = Readonly<{
  correlationId: CorrelationId;
  resolve: (result: Result<OcpSipCredentialApplyOutcome, PlatformError>) => void;
  timer: ReturnType<typeof setTimeout>;
}>;

/**
 * Observes OCP `creds` and authorizes + registers SIP.
 * Orchestration can await the next creds apply via `waitAndApplyNext`.
 */
export class OcpSipCredentialService {
  private unsubscribe: (() => void) | null = null;
  private applying = false;
  private pendingWaiter: PendingWaiter | null = null;
  /** Bumped on cancel; apply checkpoints compare against epoch captured at apply start. */
  private applyEpoch = 0;
  private readonly credentialsTimeoutMs: number;

  constructor(private readonly deps: OcpSipCredentialServiceDeps) {
    this.credentialsTimeoutMs =
      deps.credentialsTimeoutMs ?? OCP_CREDENTIALS_TIMEOUT_MS;
    this.unsubscribe = deps.ocpGateway.onMessage((message) => {
      void this.handleMessage(message);
    });
  }

  dispose(): void {
    this.applyEpoch += 1;
    this.clearPendingWaiter(
      err(
        createPlatformError("operation_failed", "ocp_credentials_disposed", {
          reason: "ocp_credentials_disposed",
        }),
      ),
    );
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /**
   * - Purpose: wait for next `creds` entity and apply SIP authorize+register.
   * - Inputs: correlationId shared with OCP HTTP/WS sign-in.
   * - Outputs: typed apply outcome or credentials timeout.
   */
  waitAndApplyNext(
    correlationId: CorrelationId,
  ): Promise<Result<OcpSipCredentialApplyOutcome, PlatformError>> {
    if (this.pendingWaiter !== null) {
      return Promise.resolve(
        err(
          createPlatformError("operation_failed", "ocp_sign_in_in_flight", {
            reason: "ocp_sign_in_in_flight",
          }),
        ),
      );
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (this.pendingWaiter?.correlationId !== correlationId) {
          return;
        }
        this.pendingWaiter = null;
        this.deps.logger.warn("ocp_sip_credentials_timeout", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_sip_credentials",
          result: "credentials_timeout",
        });
        resolve(
          err(
            createPlatformError("timeout", "ocp_credentials_timeout", {
              reason: "ocp_credentials_timeout",
            }),
          ),
        );
      }, this.credentialsTimeoutMs);

      this.pendingWaiter = {
        correlationId,
        resolve,
        timer,
      };
    });
  }

  /**
   * - Purpose: cancel an armed credentials waiter and supersede in-flight apply.
   * - Inputs: correlationId of the waiter + error to surface to the waiter.
   * - Side effects after this call: authorize Promise may settle, but promote/register
   *   and progress hooks are skipped at checkpoints.
   */
  cancelWait(correlationId: CorrelationId, error: PlatformError): void {
    this.applyEpoch += 1;
    if (this.pendingWaiter?.correlationId !== correlationId) {
      return;
    }
    this.clearPendingWaiter(err(error));
  }

  /**
   * Supersede any in-flight apply when attempt id is already cleared.
   * Does not resolve a waiter unless one is still pending (caller should cancelWait first).
   */
  cancelInFlightApplies(): void {
    this.applyEpoch += 1;
  }

  private clearPendingWaiter(
    result: Result<OcpSipCredentialApplyOutcome, PlatformError>,
  ): void {
    const waiter = this.pendingWaiter;
    if (waiter === null) {
      return;
    }
    this.pendingWaiter = null;
    clearTimeout(waiter.timer);
    waiter.resolve(result);
  }

  private isApplyEpochCurrent(epochAtStart: number): boolean {
    return this.applyEpoch === epochAtStart;
  }

  private async handleMessage(message: OcpIncomingMessage): Promise<void> {
    if (message.entity !== "creds") {
      return;
    }

    const payload: OcpSipCredentialsPayload = {
      username: message.data.username,
      password: message.data.password,
      domain: message.data.domain,
      server: message.data.server,
    };
    const waiter = this.pendingWaiter;
    const correlationId = waiter?.correlationId ?? createCorrelationId();

    if (this.applying) {
      this.deps.logger.debug("ocp_sip_credentials_skipped_in_flight", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain: payload.domain,
        username: payload.username,
        result: "skipped_in_flight",
      });
      return;
    }

    this.applying = true;
    const epochAtStart = this.applyEpoch;
    const waiterCorrelationId = waiter?.correlationId ?? null;
    try {
      const outcome = await this.applyCredentials(
        payload,
        correlationId,
        epochAtStart,
      );
      // Never resolve a newer recovery waiter with a superseded apply outcome.
      if (
        waiterCorrelationId !== null &&
        this.pendingWaiter?.correlationId === waiterCorrelationId
      ) {
        this.clearPendingWaiter(ok(outcome));
      }
    } catch (error: unknown) {
      const messageText =
        error instanceof Error ? error.message : "unknown_error";
      this.deps.logger.error("ocp_sip_credentials_apply_threw", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain: payload.domain,
        username: payload.username,
        result: messageText,
      });
      if (
        waiterCorrelationId !== null &&
        this.pendingWaiter?.correlationId === waiterCorrelationId
      ) {
        this.clearPendingWaiter(
          err(
            createPlatformError("operation_failed", "ocp_sip_credentials_threw", {
              reason: "ocp_sip_credentials_threw",
            }),
          ),
        );
      }
    } finally {
      this.applying = false;
    }
  }

  private async applyCredentials(
    payload: OcpSipCredentialsPayload,
    correlationId: CorrelationId,
    epochAtStart: number,
  ): Promise<OcpSipCredentialApplyOutcome> {
    const { username, domain, server } = payload;

    if (!this.isApplyEpochCurrent(epochAtStart)) {
      return { kind: "cancelled" };
    }

    if (this.deps.isSipRegistered()) {
      const active = await this.deps.getActiveSipIdentity();
      if (!this.isApplyEpochCurrent(epochAtStart)) {
        return { kind: "cancelled" };
      }
      if (active !== null) {
        const incoming: SettingsAccountIdentity = {
          username,
          domain,
          server,
        };
        if (matchesSipAccountIdentity(active, incoming)) {
          this.deps.logger.info("ocp_sip_credentials_already_matching", {
            correlationId,
            featureId: FEATURE_ID,
            boundedContext: BOUNDED_CONTEXT,
            operation: "ocp_sip_credentials",
            domain,
            username,
            result: "already_matching",
          });
          return { kind: "already_matching" };
        }

        this.deps.logger.warn("ocp_sip_credentials_identity_mismatch", {
          correlationId,
          featureId: FEATURE_ID,
          boundedContext: BOUNDED_CONTEXT,
          operation: "ocp_sip_credentials",
          domain,
          username,
          result: "identity_mismatch",
        });
        return { kind: "identity_mismatch" };
      }

      this.deps.logger.debug("ocp_sip_credentials_skipped_already_registered", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain,
        username,
        result: "skipped_sip_already_registered",
      });
      return { kind: "already_matching" };
    }

    if (!this.isApplyEpochCurrent(epochAtStart)) {
      return { kind: "cancelled" };
    }

    this.deps.logger.info("ocp_sip_credentials_received", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_sip_credentials",
      domain,
      username,
      result: "applying",
    });
    this.deps.onRegisteringPhone?.(correlationId);
    this.deps.onExecutionStage?.("connecting_sip_transport", correlationId);

    // Checkpoint before authorize.
    if (!this.isApplyEpochCurrent(epochAtStart)) {
      return { kind: "cancelled" };
    }

    const authorizeResult = await raceResultWithTimeout(
      this.deps.authorizeSipAccount.execute({
        account: {
          username: payload.username,
          password: payload.password,
          domain: payload.domain,
          server: payload.server,
        },
        source: "ocp",
        correlationId,
        promoteActiveSession: false,
      }),
      OCP_SIGN_IN_STAGE_TIMEOUT_MS.connecting_sip_transport,
      "ocp_sip_transport_timeout",
    );

    // Checkpoint after authorize — do not promote if cancelled.
    if (!this.isApplyEpochCurrent(epochAtStart)) {
      return { kind: "cancelled" };
    }

    if (!authorizeResult.ok) {
      this.deps.logger.error("ocp_sip_authorize_failed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain,
        username,
        result: authorizeResult.error.code,
      });
      return { kind: "authorize_failed", error: authorizeResult.error };
    }

    // Checkpoint before promote.
    if (!this.isApplyEpochCurrent(epochAtStart)) {
      return { kind: "cancelled" };
    }

    // ADR-AF-005: promote account/settings before SIP register outcome.
    // Non-cancellable boundary once this await resolves ok — session is kept.
    const promoteResult = await this.deps.promoteAuthorizedSipSession.execute({
      account: authorizeResult.value,
      correlationId,
    });

    // Checkpoint after promote — skip register if cancelled during promote.
    if (!this.isApplyEpochCurrent(epochAtStart)) {
      return { kind: "cancelled" };
    }

    if (!promoteResult.ok) {
      this.deps.logger.error("ocp_sip_promote_failed", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain,
        username,
        result: promoteResult.error.code,
      });
      return { kind: "authorize_failed", error: promoteResult.error };
    }

    // Checkpoint before register.
    if (!this.isApplyEpochCurrent(epochAtStart)) {
      return { kind: "cancelled" };
    }

    this.deps.onExecutionStage?.("authorizing_sip", correlationId);
    const registerResult = await raceResultWithTimeout(
      this.deps.registerAccount.execute({
        account: authorizeResult.value,
        correlationId,
      }),
      OCP_SIGN_IN_STAGE_TIMEOUT_MS.authorizing_sip,
      "ocp_sip_authorization_timeout",
    );

    // Checkpoint after register — do not publish applied if superseded.
    if (!this.isApplyEpochCurrent(epochAtStart)) {
      return { kind: "cancelled" };
    }

    if (!registerResult.ok) {
      this.deps.logger.warn("ocp_sip_register_failed_after_promote", {
        correlationId,
        featureId: FEATURE_ID,
        boundedContext: BOUNDED_CONTEXT,
        operation: "ocp_sip_credentials",
        domain,
        username,
        result: registerResult.error.code,
      });
      return { kind: "register_failed", error: registerResult.error };
    }

    this.deps.logger.info("ocp_sip_credentials_applied", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_sip_credentials",
      domain,
      username,
      result: "succeeded",
    });

    return { kind: "applied" };
  }
}

async function raceResultWithTimeout<T, E extends PlatformError>(
  operation: Promise<Result<T, E>>,
  timeoutMs: number,
  timeoutReason: string,
): Promise<Result<T, E | PlatformError>> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<Result<T, PlatformError>>((resolve) => {
    timer = setTimeout(() => {
      resolve(
        err(
          createPlatformError("operation_failed", timeoutReason, {
            reason: timeoutReason,
          }),
        ),
      );
    }, timeoutMs);
  });
  const result = await Promise.race([operation, timeout]);
  if (timer !== null) {
    clearTimeout(timer);
  }
  return result;
}
