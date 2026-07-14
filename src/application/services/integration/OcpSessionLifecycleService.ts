/**
 * - Purpose: handle OCP session lifecycle messages and publish operator Domain Events.
 * - Inputs: gateway messages (terminate / users / creds) + operator read model.
 * - Outputs: terminal disconnect and operator session/status/credentials events (no React).
 */

import type { OperatorStatus as OperatorStatusType } from "@domain/integration/ocp/OperatorStatus.js";
import { createOperatorCredentialsReceivedEvent } from "@domain/integration/ocp/events/OperatorCredentialsReceived.js";
import { createOperatorLoggedOutEvent } from "@domain/integration/ocp/events/OperatorLoggedOut.js";
import { createOperatorSessionEndedEvent } from "@domain/integration/ocp/events/OperatorSessionEnded.js";
import { createOperatorSessionStartedEvent } from "@domain/integration/ocp/events/OperatorSessionStarted.js";
import { createOperatorStatusChangedEvent } from "@domain/integration/ocp/events/OperatorStatusChanged.js";
import type { OcpIncomingMessage } from "@domain/integration/ocp/protocol/OcpIncomingMessage.js";
import type { DomainEventPublisher, Logger } from "@ports/index.js";
import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { OcpOperatorReadModel } from "@ports/integration/OcpOperatorReadModel.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

const FEATURE_ID = "F-028";
const BOUNDED_CONTEXT = "Integration";

/** Sentinel reason id for server-forced terminate (no logout modal). */
export const OCP_SERVER_TERMINATE_REASON_ID = 0;

export type OcpSessionLifecycleServiceDeps = Readonly<{
  ocpGateway: OcpGateway;
  operatorReadModel: OcpOperatorReadModel;
  eventPublisher: DomainEventPublisher;
  logger: Logger;
  getSessionDomain: () => string | null;
}>;

export class OcpSessionLifecycleService {
  private readonly unsubscribers: Array<() => void> = [];
  private sessionStartedPublished = false;
  private previousStatus: OperatorStatusType | null = null;
  private terminateHandled = false;

  constructor(private readonly deps: OcpSessionLifecycleServiceDeps) {
    this.unsubscribers.push(
      deps.ocpGateway.onMessage((message) => {
        this.handleMessage(message);
      }),
    );
    this.unsubscribers.push(
      deps.ocpGateway.onConnectionStateChange((state) => {
        if (state === "connecting" || state === "connected") {
          this.terminateHandled = false;
          this.sessionStartedPublished = false;
          this.previousStatus = null;
        }
      }),
    );
  }

  dispose(): void {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers.length = 0;
  }

  private handleMessage(message: OcpIncomingMessage): void {
    if (message.entity === "terminate") {
      this.handleTerminate();
      return;
    }
    if (message.entity === "users") {
      this.handleUsers(message.data);
      return;
    }
    if (message.entity === "creds") {
      this.handleCreds();
    }
  }

  private handleTerminate(): void {
    if (this.terminateHandled) {
      return;
    }
    this.terminateHandled = true;

    const correlationId = createCorrelationId();
    const profile = this.deps.operatorReadModel.getCurrentOperatorProfile();
    const operatorId = profile?.operatorId ?? 0;

    this.deps.logger.info("ocp_server_terminate_received", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_server_terminate",
      operatorId,
      result: "requested",
    });

    this.deps.eventPublisher.publish(
      createOperatorSessionEndedEvent(correlationId, {
        operatorId,
        reason: "terminate",
        timestamp: Date.now(),
      }),
    );
    this.deps.eventPublisher.publish(
      createOperatorLoggedOutEvent(correlationId, {
        operatorId,
        reasonId: OCP_SERVER_TERMINATE_REASON_ID,
        timestamp: Date.now(),
      }),
    );

    this.deps.ocpGateway.disconnect("terminate");

    this.deps.logger.info("ocp_server_terminate_completed", {
      correlationId,
      featureId: FEATURE_ID,
      boundedContext: BOUNDED_CONTEXT,
      operation: "ocp_server_terminate",
      operatorId,
      result: "completed",
    });
  }

  private handleUsers(
    data: Readonly<{
      operatorId: number;
      status: OperatorStatusType;
      reasonId: number;
      statusSince: string;
    }>,
  ): void {
    const correlationId = createCorrelationId();
    const domain = this.deps.getSessionDomain() ?? "";

    if (!this.sessionStartedPublished) {
      this.sessionStartedPublished = true;
      this.deps.eventPublisher.publish(
        createOperatorSessionStartedEvent(correlationId, {
          operatorId: data.operatorId,
          domain,
          timestamp: Date.now(),
        }),
      );
    }

    if (this.previousStatus !== null && this.previousStatus !== data.status) {
      this.deps.eventPublisher.publish(
        createOperatorStatusChangedEvent(correlationId, {
          operatorId: data.operatorId,
          prevStatus: this.previousStatus,
          newStatus: data.status,
          reasonId: data.reasonId,
          timestamp: Date.now(),
        }),
      );
    }

    this.previousStatus = data.status;
  }

  private handleCreds(): void {
    this.deps.eventPublisher.publish(
      createOperatorCredentialsReceivedEvent(createCorrelationId()),
    );
  }
}
