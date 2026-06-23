import {
  createCampaignEventReceivedEvent,
  createOcpNotificationReceivedEvent,
  createQueueInfoReceivedEvent,
  matchQueueInfoToCall,
  type CallId,
  type OcpCampaignEventPayload,
  type OcpNotificationPayload,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  OcpCallCorrelationRegistry,
  OcpSyncGateway,
  OcpSyncReadModel,
} from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

export type ProcessOcpInboundMessageInput = Readonly<{
  raw: unknown;
  correlationId?: CorrelationId;
}>;

export type ProcessOcpInboundMessageOutcome =
  | Readonly<{ action: "noop"; reason: "unparseable" | "sip_only" | "unknown_kind" }>
  | Readonly<{
      action: "queue_rejected";
      reason: "no_correlation" | "main_acallid_mismatch";
    }>
  | Readonly<{ action: "queue_info_published"; callId: CallId }>
  | Readonly<{ action: "campaign_published"; callId: CallId | null }>
  | Readonly<{ action: "notification_published"; notificationId: string }>;

/**
 * - Purpose: parse inbound OCP sync messages and publish matched domain events.
 * - Inputs: raw WebSocket payload, registry snapshot, OCP mode flag.
 * - Outputs: QueueInfoReceived or CampaignEventReceived, or structured no-op.
 */
export class ProcessOcpInboundMessageUseCase {
  constructor(
    private readonly ocpSyncGateway: OcpSyncGateway,
    private readonly correlationRegistry: OcpCallCorrelationRegistry,
    private readonly ocpSyncReadModel: OcpSyncReadModel,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  execute(input: ProcessOcpInboundMessageInput): Result<ProcessOcpInboundMessageOutcome, never> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const parsed = this.ocpSyncGateway.parseInboundMessage(input.raw);

    if (parsed === null) {
      this.logger.warn("ocp_inbound_message_unparseable", {
        correlationId,
        featureId: "F-015",
        boundedContext: "Operator",
        operation: "process_ocp_inbound",
        result: "noop",
      });
      return ok({ action: "noop", reason: "unparseable" });
    }

    const isOcpMode = this.ocpSyncReadModel.getSnapshot().isOcpSyncAvailable;
    if (!isOcpMode) {
      this.logger.info("ocp_queue_info_rejected", {
        correlationId,
        featureId: "F-015",
        boundedContext: "Operator",
        operation: "process_ocp_inbound",
        result: "rejected",
        reason: "sip_only",
      });
      return ok({ action: "noop", reason: "sip_only" });
    }

    if (parsed.kind === "queue_info") {
      return ok(this.handleQueueInfo(parsed.mainAcallId, parsed.queueName, correlationId, isOcpMode));
    }

    if (parsed.kind === "campaign_event") {
      return ok(this.handleCampaignEvent(parsed, correlationId, isOcpMode));
    }

    if (parsed.kind === "notification") {
      return ok(this.handleNotification(parsed, correlationId, isOcpMode));
    }

    this.logger.warn("ocp_inbound_message_unknown_kind", {
      correlationId,
      featureId: "F-015",
      boundedContext: "Operator",
      operation: "process_ocp_inbound",
      result: "noop",
    });
    return ok({ action: "noop", reason: "unknown_kind" });
  }

  private handleQueueInfo(
    queueMainAcallId: Parameters<typeof matchQueueInfoToCall>[0]["queueMainAcallId"],
    queueName: string,
    correlationId: CorrelationId,
    isOcpMode: boolean,
  ): ProcessOcpInboundMessageOutcome {
    const matchResult = matchQueueInfoToCall({
      isOcpMode,
      queueMainAcallId,
      knownCorrelations: this.correlationRegistry.listAll(),
    });

    if (!matchResult.ok) {
      if (matchResult.reason !== "sip_only") {
        this.logger.info("ocp_queue_info_rejected", {
          correlationId,
          featureId: "F-015",
          boundedContext: "Operator",
          operation: "process_ocp_inbound",
          result: "rejected",
          reason: matchResult.reason,
          queueMainAcallId,
        });
      }
      if (matchResult.reason === "no_correlation" || matchResult.reason === "main_acallid_mismatch") {
        return { action: "queue_rejected", reason: matchResult.reason };
      }
      return { action: "noop", reason: "sip_only" };
    }

    this.eventPublisher.publish(
      createQueueInfoReceivedEvent(correlationId, {
        callId: matchResult.callId,
        mainAcallId: queueMainAcallId,
        queueName,
      }),
    );

    this.logger.info("ocp_queue_info_matched", {
      correlationId,
      featureId: "F-015",
      boundedContext: "Operator",
      operation: "process_ocp_inbound",
      result: "succeeded",
      callId: matchResult.callId,
      queueMainAcallId,
    });

    return { action: "queue_info_published", callId: matchResult.callId };
  }

  private handleCampaignEvent(
    payload: OcpCampaignEventPayload,
    correlationId: CorrelationId,
    isOcpMode: boolean,
  ): ProcessOcpInboundMessageOutcome {
    let matchedCallId: CallId | null = null;
    if (payload.mainAcallId !== null) {
      const matchResult = matchQueueInfoToCall({
        isOcpMode,
        queueMainAcallId: payload.mainAcallId,
        knownCorrelations: this.correlationRegistry.listAll(),
      });
      if (matchResult.ok) {
        matchedCallId = matchResult.callId;
      }
    }

    this.eventPublisher.publish(
      createCampaignEventReceivedEvent(correlationId, {
        campaignId: payload.campaignId,
        title: payload.title,
        mainAcallId: payload.mainAcallId,
        progressive: payload.progressive,
        callId: matchedCallId,
      }),
    );

    this.logger.info("ocp_campaign_event_received", {
      correlationId,
      featureId: "F-015",
      boundedContext: "Operator",
      operation: "process_ocp_inbound",
      result: "succeeded",
      campaignId: payload.campaignId,
      ...(matchedCallId !== null ? { callId: matchedCallId } : {}),
    });

    return { action: "campaign_published", callId: matchedCallId };
  }

  private handleNotification(
    payload: OcpNotificationPayload,
    correlationId: CorrelationId,
    isOcpMode: boolean,
  ): ProcessOcpInboundMessageOutcome {
    if (!isOcpMode) {
      return { action: "noop", reason: "sip_only" };
    }

    this.eventPublisher.publish(
      createOcpNotificationReceivedEvent(correlationId, {
        notificationId: payload.notificationId,
        message: payload.message,
        level: payload.level,
      }),
    );

    this.logger.info("ocp_notification_received", {
      correlationId,
      featureId: "F-015",
      boundedContext: "Operator",
      operation: "process_ocp_inbound",
      result: "succeeded",
      notificationId: payload.notificationId,
    });

    return { action: "notification_published", notificationId: payload.notificationId };
  }
}
