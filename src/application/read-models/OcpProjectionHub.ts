/**
 * - Purpose: gateway-driven OCP projection hub implementing OcpOperatorReadModel.
 * - Inputs: OcpGateway messages/state, optional reasons cache hydration.
 * - Outputs: session/operator/reasons/campaign snapshots for Use Cases and UI.
 */

import type { OperatorProfile } from "@domain/integration/ocp/OperatorProfile.js";
import type { OperatorStatus as OperatorStatusType } from "@domain/integration/ocp/OperatorStatus.js";
import type { OcpConnectionState } from "@domain/integration/ocp/OcpConnectionState.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { OcpGateway, Unsubscribe } from "@ports/integration/OcpGateway.js";
import type { OcpOperatorReadModel } from "@ports/integration/OcpOperatorReadModel.js";
import type { OcpReasonsCachePort } from "@ports/integration/OcpReasonsCachePort.js";
import {
  initialCampaignEventProjection,
  reduceCampaignEventFromPayload,
  clearCampaignEvent,
  type CampaignEventProjection,
} from "../projections/integration/campaignEventProjection.js";
import {
  initialOcpReasonsProjection,
  reduceOcpReasonsFromPayload,
  type OcpReasonsProjection,
} from "../projections/integration/ocpReasonsProjection.js";
import {
  applyOcpAuthFeedback,
  applyOcpSessionDomain,
  clearOcpAuthFeedback,
  initialOcpSessionProjection,
  reduceOcpSessionFromConnectionState,
  reduceOcpSessionFromMessage,
  type OcpAuthFeedbackReason,
  type OcpSessionProjection,
} from "../projections/integration/ocpSessionProjection.js";
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
 * Holds serializable OCP projections; updated only from gateway callbacks.
 */
export class OcpProjectionHub implements OcpOperatorReadModel {
  private session: OcpSessionProjection = initialOcpSessionProjection();
  private operator: OperatorStatusProjection = initialOperatorStatusProjection();
  private reasons: OcpReasonsProjection = initialOcpReasonsProjection();
  private campaign: CampaignEventProjection = initialCampaignEventProjection();
  private readonly unsubscribers: Unsubscribe[] = [];
  private readonly changeListeners = new Set<() => void>();
  private authFeedbackNonce = 0;

  constructor(private readonly deps: OcpProjectionHubDeps) {
    this.unsubscribers.push(
      deps.ocpGateway.onConnectionStateChange((state) => {
        this.applyConnectionState(state);
      }),
    );
    this.unsubscribers.push(
      deps.ocpGateway.onMessage((message) => {
        this.applyMessage(message);
      }),
    );
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

  getCurrentOperatorProfile(): OperatorProfile | null {
    return toOperatorProfile(this.operator);
  }

  getReservedStatus(): OperatorStatusType | null {
    return this.operator.reservedStatus;
  }

  setSessionDomain(domain: string): void {
    this.session = applyOcpSessionDomain(this.session, domain);
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

  clearActiveCampaign(): void {
    this.campaign = clearCampaignEvent();
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

  private applyConnectionState(state: OcpConnectionState): void {
    this.session = reduceOcpSessionFromConnectionState(this.session, state);
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
