import { parseOcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";
import type { OcpInboundMessage } from "@domain/operator/ocp/OcpInboundMessages.js";
import type {
  OcpSyncGateway,
  RespondToCampaignCommand,
  RespondToCampaignResult,
  SendDlgStopCommand,
  SendDlgStopResult,
} from "@ports/operator/OcpSyncGateway.js";
import type { OcpWebSocketTransport } from "./OcpWebSocketTransport.js";
import {
  buildCampaignRespondPayload,
  buildDlgStopPayload,
  isGatewaySuccess,
} from "./ocpWebSocketProtocol.js";

export type WebSocketOcpSyncGatewayOptions = Readonly<{
  transport: OcpWebSocketTransport;
}>;

/**
 * - Purpose: real OCP sync gateway for inbound parse and outbound campaign/dlg_stop.
 * - Inputs: raw inbound payloads; campaign respond and dlg_stop commands.
 * - Outputs: typed OcpInboundMessage or null; gateway confirm results.
 */
export class WebSocketOcpSyncGateway implements OcpSyncGateway {
  constructor(private readonly options: WebSocketOcpSyncGatewayOptions) {}

  parseInboundMessage(raw: unknown): OcpInboundMessage | null {
    const parsed = parseOcpInboundMessage(raw);
    if (typeof parsed === "string") {
      return null;
    }
    return parsed;
  }

  async respondToCampaign(
    command: RespondToCampaignCommand,
  ): Promise<RespondToCampaignResult> {
    try {
      const response = await this.options.transport.request(
        "campaign_respond",
        buildCampaignRespondPayload(command.campaignId, command.decision),
        command.correlationId,
      );

      if (!isGatewaySuccess(response)) {
        return {
          status: "failed",
          reason: "rejected",
          message: "Campaign response rejected",
        };
      }

      return { status: "succeeded" };
    } catch {
      return Promise.reject(new Error("campaign respond network error"));
    }
  }

  async sendDlgStop(command: SendDlgStopCommand): Promise<SendDlgStopResult> {
    try {
      const response = await this.options.transport.request(
        "dlg_stop",
        buildDlgStopPayload(command.callId, command.mainAcallId),
        command.correlationId,
      );

      if (!isGatewaySuccess(response)) {
        return {
          status: "failed",
          reason: "rejected",
          message: "dlg_stop rejected",
        };
      }

      return { status: "succeeded" };
    } catch {
      return Promise.reject(new Error("dlg_stop network error"));
    }
  }
}
