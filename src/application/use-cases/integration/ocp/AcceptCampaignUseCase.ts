import type { OcpGateway } from "@ports/integration/OcpGateway.js";
import type { Logger } from "@ports/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { CorrelationId } from "@shared/correlation-id/index.js";
import { ok } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";
import {
  OCP_BOUNDED_CONTEXT,
  OCP_USE_CASE_FEATURE_ID,
} from "./ocpUseCaseShared.js";

export type AcceptCampaignInput = Readonly<{
  operatorId: number;
  campaignEventId: string;
  correlationId?: CorrelationId;
}>;

/**
 * - Purpose: accept an OCP campaign offer for the operator.
 * - Inputs: operator id and campaign event id from incoming message.
 * - Outputs: campaign_accept gateway command.
 */
export class AcceptCampaignUseCase {
  constructor(
    private readonly ocpGateway: OcpGateway,
    private readonly logger: Logger,
  ) {}

  execute(input: AcceptCampaignInput): Promise<Result<void, PlatformError>> {
    const correlationId = input.correlationId ?? createCorrelationId();

    this.logger.info("accept_campaign_requested", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "accept_campaign",
      operatorId: input.operatorId,
      campaignEventId: input.campaignEventId,
      result: "requested",
    });

    const sendResult = this.ocpGateway.sendCommand({
      kind: "campaign_accept",
      operatorId: input.operatorId,
      campaignEventId: input.campaignEventId,
    });

    if (!sendResult.ok) {
      this.logger.error(
        "accept_campaign_send_failed",
        {
          correlationId,
          featureId: OCP_USE_CASE_FEATURE_ID,
          boundedContext: OCP_BOUNDED_CONTEXT,
          operation: "accept_campaign",
          result: sendResult.error.code,
        },
        sendResult.error,
      );
      return Promise.resolve(sendResult);
    }

    this.logger.info("accept_campaign_completed", {
      correlationId,
      featureId: OCP_USE_CASE_FEATURE_ID,
      boundedContext: OCP_BOUNDED_CONTEXT,
      operation: "accept_campaign",
      result: "completed",
    });

    return Promise.resolve(ok(undefined));
  }
}
