import {
  createCampaignEventAnsweredEvent,
  type CallId,
  type CampaignDecision,
} from "@domain/index.js";
import type {
  DomainEventPublisher,
  Logger,
  OcpSyncGateway,
  OcpSyncReadModel,
} from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { createPlatformError, normalizeUnknownError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type RespondToCampaignInput = Readonly<{
  campaignId: string;
  decision: CampaignDecision;
  callId?: CallId | null;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: send campaign accept/reject to OCP gateway and publish answered event (LF-040).
 * - Inputs: campaignId, decision, optional callId, correlationId.
 * - Outputs: gateway confirm then CampaignEventAnswered; observable failure.
 */
export class RespondToCampaignUseCase {
  constructor(
    private readonly ocpSyncGateway: OcpSyncGateway,
    private readonly ocpSyncReadModel: OcpSyncReadModel,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly logger: Logger,
  ) {}

  async execute(
    input: RespondToCampaignInput,
  ): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();
    const snapshot = this.ocpSyncReadModel.getSnapshot();

    if (!snapshot.isOcpSyncAvailable) {
      return err(
        createPlatformError("operation_failed", "OCP sync unavailable", {
          reason: "ocp_unavailable",
        }),
      );
    }

    this.logger.info("campaign_response_requested", {
      correlationId,
      featureId: "F-015",
      boundedContext: "Operator",
      operation: "respond_to_campaign",
      campaignId: input.campaignId,
      decision: input.decision,
      result: "requested",
    });

    try {
      const gatewayResult = await this.ocpSyncGateway.respondToCampaign({
        campaignId: input.campaignId,
        decision: input.decision,
        correlationId,
      });

      if (gatewayResult.status === "failed") {
        this.logger.warn("campaign_response_failed", {
          correlationId,
          featureId: "F-015",
          boundedContext: "Operator",
          operation: "respond_to_campaign",
          campaignId: input.campaignId,
          decision: input.decision,
          result: gatewayResult.reason,
          gatewayMessage: gatewayResult.message,
        });
        return err(
          createPlatformError("operation_failed", gatewayResult.message, {
            reason: gatewayResult.reason,
          }),
        );
      }

      this.eventPublisher.publish(
        createCampaignEventAnsweredEvent(correlationId, {
          campaignId: input.campaignId,
          decision: input.decision,
          callId: input.callId ?? null,
        }),
      );

      this.logger.info("campaign_response_succeeded", {
        correlationId,
        featureId: "F-015",
        boundedContext: "Operator",
        operation: "respond_to_campaign",
        campaignId: input.campaignId,
        decision: input.decision,
        result: "succeeded",
      });

      return ok(undefined);
    } catch (error: unknown) {
      const normalized = normalizeUnknownError(error);
      this.logger.error(
        "campaign_response_failed",
        {
          correlationId,
          featureId: "F-015",
          boundedContext: "Operator",
          operation: "respond_to_campaign",
          campaignId: input.campaignId,
          decision: input.decision,
          result: "error",
        },
        error,
      );
      return err(normalized);
    }
  }
}
