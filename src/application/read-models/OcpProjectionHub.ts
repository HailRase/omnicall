/**
 * - Purpose: gateway-driven OCP projection hub implementing OcpOperatorReadModel.
 * - Inputs: OcpGateway transport states/messages, optional reasons cache hydration.
 * - Outputs: dual-FSM session/operator/reasons/campaign/call-context snapshots for Use Cases and UI.
 */

import type { OperatorProfile } from "@domain/integration/ocp/OperatorProfile.js";
import type { OperatorStatus as OperatorStatusType } from "@domain/integration/ocp/OperatorStatus.js";
import type { OcpServerState } from "@domain/integration/ocp/OcpServerState.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { OcpGateway, Unsubscribe } from "@ports/integration/OcpGateway.js";
import type { OcpOperatorReadModel } from "@ports/integration/OcpOperatorReadModel.js";
import type { OcpReasonsCachePort } from "@ports/integration/OcpReasonsCachePort.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import {
  initialCampaignEventProjection,
  reduceCampaignEventFromPayload,
  clearCampaignEvent,
  type CampaignEventProjection,
} from "../projections/integration/campaignEventProjection.js";
import {
  clearCallOcpContext,
  initialCallOcpContextProjection,
  markCallOcpContextPending,
  markCallOcpContextUnavailable,
  resolveCallOcpContext,
  resetCallOcpContextProjection,
  type CallOcpContextDirection,
  type CallOcpContextProjection,
} from "../projections/integration/callOcpContextProjection.js";
import {
  initialOcpReasonsProjection,
  reduceOcpReasonsFromPayload,
  type OcpReasonsProjection,
} from "../projections/integration/ocpReasonsProjection.js";
import {
  applyAuthorizationProgress,
  applyOcpActiveAttemptId,
  applyOcpAuthFeedback,
  applyOcpSessionAuthenticatedLogin,
  applyOcpSessionDomain,
  clearOcpAuthFeedback,
  initialOcpSessionProjection,
  reduceOcpSessionFromAuthorization,
  reduceOcpSessionFromServerState,
  reduceOcpSessionFromMessage,
  type OcpAuthFeedbackReason,
  type OcpSessionProjection,
} from "../projections/integration/ocpSessionProjection.js";
import type { AuthorizationProgressProjection } from "../projections/settings/authorizationProgressProjection.js";
import {
  applyOperatorReservedStatus,
  clearOperatorReservedStatus,
  initialOperatorStatusProjection,
  reduceOperatorStatusFromUsers,
  toOperatorProfile,
  type OperatorStatusProjection,
} from "../projections/integration/operatorStatusProjection.js";

export type OcpProjectionHubDeps = Readonly<{
  ocpGateway: OcpGateway;
  reasonsCache?: OcpReasonsCachePort;
}>;

/**
 * Holds serializable OCP projections; updated from gateway callbacks + Application marks.
 */
export class OcpProjectionHub implements OcpOperatorReadModel {
  private session: OcpSessionProjection = initialOcpSessionProjection();
  private operator: OperatorStatusProjection = initialOperatorStatusProjection();
  private reasons: OcpReasonsProjection = initialOcpReasonsProjection();
  private campaign: CampaignEventProjection = initialCampaignEventProjection();
  private callOcpContext: CallOcpContextProjection =
    initialCallOcpContextProjection();
  private readonly unsubscribers: Unsubscribe[] = [];
  private readonly changeListeners = new Set<() => void>();
  private authFeedbackNonce = 0;
  private activeSocketEpoch: number | null = null;

  constructor(private readonly deps: OcpProjectionHubDeps) {
    this.unsubscribers.push(
      deps.ocpGateway.onConnectionStateChange((state) => {
        this.applyServerState(state);
      }),
    );
    if (deps.ocpGateway.onMessageEnvelope !== undefined) {
      this.unsubscribers.push(
        deps.ocpGateway.onMessageEnvelope((envelope) => {
          if (
            this.activeSocketEpoch !== null &&
            envelope.socketEpoch !== this.activeSocketEpoch
          ) {
            return;
          }
          this.applyMessage(envelope.message);
        }),
      );
    } else {
      this.unsubscribers.push(
        deps.ocpGateway.onMessage((message) => {
          this.applyMessage(message);
        }),
      );
    }
  }

  /**
   * - Purpose: notify UI projection sync when hub snapshots change.
   * - Inputs: listener invoked after connection/message reducers.
   * - Outputs: unsubscribe function.
   */
  subscribe(listener: () => void): Unsubscribe {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  getSessionProjection(): OcpSessionProjection {
    return this.session;
  }

  getOperatorProjection(): OperatorStatusProjection {
    return this.operator;
  }

  getReasonsProjection(): OcpReasonsProjection {
    return this.reasons;
  }

  getCampaignProjection(): CampaignEventProjection {
    return this.campaign;
  }

  getCallOcpContextProjection(): CallOcpContextProjection {
    return this.callOcpContext;
  }

  markCallOcpContextPending(
    callId: string,
    direction: CallOcpContextDirection,
  ): void {
    this.callOcpContext = markCallOcpContextPending(this.callOcpContext, {
      callId,
      direction,
    });
    this.notifyChangeListeners();
  }

  resolveCallOcpContext(
    callId: string,
    input: Readonly<{ acallId: string; queueName: string | null }>,
  ): void {
    this.callOcpContext = resolveCallOcpContext(this.callOcpContext, {
      callId,
      acallId: input.acallId,
      queueName: input.queueName,
    });
    this.notifyChangeListeners();
  }

  markCallOcpContextUnavailable(callId: string): void {
    this.callOcpContext = markCallOcpContextUnavailable(
      this.callOcpContext,
      callId,
    );
    this.notifyChangeListeners();
  }

  clearCallOcpContext(callId: string): void {
    this.callOcpContext = clearCallOcpContext(this.callOcpContext, callId);
    this.notifyChangeListeners();
  }

  getCurrentOperatorProfile(): OperatorProfile | null {
    return toOperatorProfile(this.operator);
  }

  getReservedStatus(): OperatorStatusType | null {
    return this.operator.reservedStatus;
  }

  getReservedReasonId(): number | null {
    return this.operator.reservedReasonId;
  }

  setSessionDomain(domain: string): void {
    this.session = applyOcpSessionDomain(this.session, domain);
    this.notifyChangeListeners();
  }

  /** Persist OCP connect login for call-sync wire (`user_login`). */
  setSessionAuthenticatedLogin(login: string): void {
    const trimmed = login.trim();
    if (trimmed.length === 0) {
      return;
    }
    this.session = applyOcpSessionAuthenticatedLogin(this.session, trimmed);
    this.notifyChangeListeners();
  }

  /**
   * Begin or supersede an OCP attempt. Late events with a different id are ignored.
   */
  beginAttempt(attemptId: CorrelationId): void {
    this.activeSocketEpoch = this.deps.ocpGateway.getSocketEpoch?.() ?? null;
    this.session = applyOcpActiveAttemptId(this.session, attemptId);
    this.notifyChangeListeners();
  }

  bindActiveAttemptToCurrentSocket(attemptId: CorrelationId): void {
    if (!this.isActiveAttempt(attemptId)) {
      return;
    }
    this.activeSocketEpoch = this.deps.ocpGateway.getSocketEpoch?.() ?? null;
  }

  clearAttempt(): void {
    this.activeSocketEpoch = null;
    this.session = applyOcpActiveAttemptId(this.session, null);
    this.notifyChangeListeners();
  }

  isActiveAttempt(attemptId: CorrelationId): boolean {
    return this.session.activeAttemptId === attemptId;
  }

  markAuthorizationPending(attemptId: CorrelationId): void {
    if (!this.isActiveAttempt(attemptId)) {
      return;
    }
    this.session = reduceOcpSessionFromAuthorization(this.session, {
      type: "auth_requested",
    });
    this.notifyChangeListeners();
  }

  /** Application-owned reconnect loop marks transport as reconnecting. */
  markServerReconnecting(attemptId: CorrelationId): void {
    if (!this.isActiveAttempt(attemptId)) {
      return;
    }
    this.session = reduceOcpSessionFromServerState(this.session, "reconnecting");
    this.notifyChangeListeners();
  }

  setAuthFeedback(reason: OcpAuthFeedbackReason): void {
    this.authFeedbackNonce += 1;
    this.session = applyOcpAuthFeedback(
      this.session,
      reason,
      this.authFeedbackNonce,
    );
    this.notifyChangeListeners();
  }

  clearAuthFeedback(): void {
    this.session = clearOcpAuthFeedback(this.session);
    this.notifyChangeListeners();
  }

  setAuthorizationProgress(progress: AuthorizationProgressProjection): void {
    this.session = applyAuthorizationProgress(this.session, progress);
    this.notifyChangeListeners();
  }

  setReservedStatus(
    reservedStatus: OperatorStatusType,
    reservedReasonId: number,
  ): void {
    this.operator = applyOperatorReservedStatus(
      this.operator,
      reservedStatus,
      reservedReasonId,
    );
    this.notifyChangeListeners();
  }

  clearReservedStatus(): void {
    this.operator = clearOperatorReservedStatus(this.operator);
    this.notifyChangeListeners();
  }

  /**
   * Clears preview + progressive slots. Returns the cleared campaign id when one
   * was active (for SDK cleared events).
   */
  clearActiveCampaign(): string | null {
    const previous =
      this.campaign.activeCampaign?.id ??
      this.campaign.progressiveContext?.id ??
      null;
    this.campaign = clearCampaignEvent();
    this.notifyChangeListeners();
    return previous;
  }

  /** Snapshot of the active campaign id without clearing (preview preferred). */
  getActiveCampaignId(): string | null {
    return (
      this.campaign.activeCampaign?.id ??
      this.campaign.progressiveContext?.id ??
      null
    );
  }

  /**
   * Cold-start reset after intentional user logout (not server terminate).
   * Clears session/operator/campaign/attempt so UI matches a freshly opened app.
   * Keeps cached reasons for the next sign-in.
   */
  resetToIdle(): void {
    this.activeSocketEpoch = null;
    this.authFeedbackNonce = 0;
    this.session = initialOcpSessionProjection();
    this.operator = initialOperatorStatusProjection();
    this.campaign = initialCampaignEventProjection();
    this.callOcpContext = resetCallOcpContextProjection();
    this.notifyChangeListeners();
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers.length = 0;
    this.changeListeners.clear();
  }

  private notifyChangeListeners(): void {
    for (const listener of this.changeListeners) {
      listener();
    }
  }

  private applyServerState(state: OcpServerState): void {
    // After cancel → cold idle: ignore late connecting/connected/failed/reconnecting
    // from a superseded in-flight ConnectOcp (ADR-AF-002). Owned attempts
    // (activeAttemptId set) and live sessions still accept transport transitions.
    const isColdIdle =
      this.session.activeAttemptId === null &&
      this.session.serverState === "disconnected" &&
      this.session.authorizationState.phase === "idle";
    if (isColdIdle && state !== "disconnected") {
      return;
    }
    this.session = reduceOcpSessionFromServerState(this.session, state);
    this.notifyChangeListeners();
  }

  private applyMessage(message: OcpIncomingMessage): void {
    this.session = reduceOcpSessionFromMessage(this.session, message);

    if (message.entity === "users") {
      this.operator = reduceOperatorStatusFromUsers(this.operator, message.data);
      this.hydrateReasonsFromCache(message.data.operatorId);
      this.notifyChangeListeners();
      return;
    }

    if (message.entity === "operator_status_reasons") {
      this.reasons = reduceOcpReasonsFromPayload(message.data);
      this.persistReasonsCache();
      this.notifyChangeListeners();
      return;
    }

    if (message.entity === "campaign_events") {
      this.campaign = reduceCampaignEventFromPayload(message.data);
    }

    this.notifyChangeListeners();
  }

  private hydrateReasonsFromCache(operatorId: number): void {
    const cache = this.deps.reasonsCache;
    if (cache === undefined) {
      return;
    }
    if (this.reasons.breakReasons.length > 0) {
      return;
    }
    const cached = cache.load(operatorId);
    if (cached === null || cached.length === 0) {
      return;
    }
    this.reasons = reduceOcpReasonsFromPayload(cached);
  }

  private persistReasonsCache(): void {
    const cache = this.deps.reasonsCache;
    const operatorId = this.operator.operatorId;
    if (cache === undefined || operatorId === null) {
      return;
    }
    cache.save(operatorId, [
      ...this.reasons.readyReasons,
      ...this.reasons.breakReasons,
      ...this.reasons.logoutReasons,
    ]);
  }
}
