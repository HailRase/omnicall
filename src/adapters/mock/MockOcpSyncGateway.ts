import { createMainAcallId } from "@domain/operator/ocp/MainAcallId.js";
import type { OcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";
import { parseOcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";
import type {
  OcpSyncGateway,
  RespondToCampaignCommand,
  RespondToCampaignResult,
  SendDlgStopCommand,
  SendDlgStopResult,
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

export const SAMPLE_OCP_NOTIFICATION_MESSAGE: OcpInboundMessage = {
  kind: "notification",
  notificationId: "notif-sample-1",
  message: "Queue assignment updated",
  level: "info",
};

export const SAMPLE_OCP_SERVER_TERMINATE_MESSAGE: OcpInboundMessage = {
  kind: "server_terminate",
  entityId: "agent-001",
  reason: "session_revoked",
};

export type MockOcpSyncScenario =
  | Readonly<{ type: "return_null" }>
  | Readonly<{ type: "fixture"; message: OcpInboundMessage }>;

export type MockOcpCampaignRespondScenario = "success" | "failed" | "network_error";
export type MockDlgStopScenario = "success" | "failed" | "network_error";

/**
 * - Purpose: mock OCP sync gateway for tests and dev bootstrap.
 * - Inputs: raw inbound payloads and optional failure scenarios.
 * - Outputs: parsed OcpInboundMessage or null.
 */
export class MockOcpSyncGateway implements OcpSyncGateway {
  private scenario: MockOcpSyncScenario | null = null;
  private campaignRespondScenario: MockOcpCampaignRespondScenario = "success";
  private dlgStopScenario: MockDlgStopScenario = "success";
  private lastCampaignRespondCommand: RespondToCampaignCommand | null = null;
  private lastDlgStopCommand: SendDlgStopCommand | null = null;
  private dlgStopSendCount = 0;

  setScenario(scenario: MockOcpSyncScenario | null): void {
    this.scenario = scenario;
  }

  setCampaignRespondScenario(scenario: MockOcpCampaignRespondScenario): void {
    this.campaignRespondScenario = scenario;
  }

  setDlgStopScenario(scenario: MockDlgStopScenario): void {
    this.dlgStopScenario = scenario;
  }

  getLastDlgStopCommand(): SendDlgStopCommand | null {
    return this.lastDlgStopCommand;
  }

  getDlgStopSendCount(): number {
    return this.dlgStopSendCount;
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

  sendDlgStop(command: SendDlgStopCommand): Promise<SendDlgStopResult> {
    this.lastDlgStopCommand = command;
    this.dlgStopSendCount += 1;

    if (this.dlgStopScenario === "network_error") {
      return Promise.reject(new Error("dlg_stop network error"));
    }

    if (this.dlgStopScenario === "failed") {
      return Promise.resolve({
        status: "failed",
        reason: "rejected",
        message: "dlg_stop rejected",
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

export function createSampleOcpNotificationRawMessage(
  message: string,
  level: "info" | "warn" | "error" = "info",
  notificationId?: string,
): Record<string, string> {
  const payload: Record<string, string> = {
    event: "notification",
    message,
    level,
  };
  if (notificationId !== undefined) {
    payload["notification_id"] = notificationId;
  }
  return payload;
}

export function createSampleOcpServerTerminateRawMessage(
  entityId: string,
  reason = "server_terminate",
): Record<string, string> {
  return {
    event: "server_terminate",
    entity_id: entityId,
    reason,
  };
}
