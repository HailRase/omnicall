import { createMainAcallId } from "@domain/operator/ocp/MainAcallId.js";
import type { OcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";
import { parseOcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";
import type {
  OcpSyncGateway,
  RespondToCampaignCommand,
  RespondToCampaignResult,
} from "@ports/operator/OcpSyncGateway.js";

export const SAMPLE_OCP_QUEUE_INFO_MESSAGE: OcpInboundMessage = {
  kind: "queue_info",
  mainAcallId: createMainAcallId("acall-sample-1"),
  queueName: "Support Queue",
};

export const SAMPLE_OCP_CAMPAIGN_EVENT_MESSAGE: OcpInboundMessage = {
  kind: "campaign_event",
  campaignId: "camp-1",
  title: "Outbound Campaign",
  mainAcallId: createMainAcallId("acall-sample-1"),
  progressive: false,
};

export type MockOcpSyncScenario =
  | Readonly<{ type: "return_null" }>
  | Readonly<{ type: "fixture"; message: OcpInboundMessage }>;

export type MockOcpCampaignRespondScenario = "success" | "failed" | "network_error";

/**
 * - Purpose: mock OCP sync gateway for tests and dev bootstrap.
 * - Inputs: raw inbound payloads and optional failure scenarios.
 * - Outputs: parsed OcpInboundMessage or null.
 */
export class MockOcpSyncGateway implements OcpSyncGateway {
  private scenario: MockOcpSyncScenario | null = null;
  private campaignRespondScenario: MockOcpCampaignRespondScenario = "success";
  private lastCampaignRespondCommand: RespondToCampaignCommand | null = null;

  setScenario(scenario: MockOcpSyncScenario | null): void {
    this.scenario = scenario;
  }

  setCampaignRespondScenario(scenario: MockOcpCampaignRespondScenario): void {
    this.campaignRespondScenario = scenario;
  }

  getLastCampaignRespondCommand(): RespondToCampaignCommand | null {
    return this.lastCampaignRespondCommand;
  }

  parseInboundMessage(raw: unknown): OcpInboundMessage | null {
    if (this.scenario?.type === "return_null") {
      return null;
    }
    if (this.scenario?.type === "fixture") {
      return this.scenario.message;
    }

    const parsed = parseOcpInboundMessage(raw);
    if (typeof parsed === "string") {
      return null;
    }
    return parsed;
  }

  respondToCampaign(command: RespondToCampaignCommand): Promise<RespondToCampaignResult> {
    this.lastCampaignRespondCommand = command;

    if (this.campaignRespondScenario === "network_error") {
      return Promise.reject(new Error("campaign respond network error"));
    }

    if (this.campaignRespondScenario === "failed") {
      return Promise.resolve({
        status: "failed",
        reason: "rejected",
        message: "Campaign response rejected",
      });
    }

    return Promise.resolve({ status: "succeeded" });
  }
}

export function createSampleOcpQueueInfoRawMessage(
  mainAcallId: string,
  queueName: string,
): Record<string, string> {
  return {
    event: "queue_info",
    main_acallid: mainAcallId,
    queue_name: queueName,
  };
}

export function createSampleOcpCampaignEventRawMessage(
  campaignId: string,
  title: string,
  mainAcallId?: string,
): Record<string, string | boolean> {
  const message: Record<string, string | boolean> = {
    event: "campaign_event",
    campaign_id: campaignId,
    title,
    progressive: false,
  };
  if (mainAcallId !== undefined) {
    message["main_acallid"] = mainAcallId;
  }
  return message;
}
