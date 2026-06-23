import { describe, expect, it } from "vitest";
import { parseOcpInboundMessage } from "./OcpInboundMessages.js";

describe("parseOcpInboundMessage", () => {
  it("parses queue_info with snake_case fields", () => {
    const result = parseOcpInboundMessage({
      event: "queue_info",
      main_acallid: "acall-42",
      queue_name: "Sales Queue",
    });

    expect(result).toEqual({
      kind: "queue_info",
      mainAcallId: "acall-42",
      queueName: "Sales Queue",
    });
  });

  it("parses campaign_event skeleton", () => {
    const result = parseOcpInboundMessage({
      type: "campaign_event",
      campaign_id: "camp-1",
      title: "Outbound offer",
      main_acallid: "acall-99",
      progressive: false,
    });

    expect(result).toEqual({
      kind: "campaign_event",
      campaignId: "camp-1",
      title: "Outbound offer",
      mainAcallId: "acall-99",
      progressive: false,
    });
  });

  it("parses notification message", () => {
    const result = parseOcpInboundMessage({
      event: "notification",
      notification_id: "n-1",
      message: "Agent ready",
      level: "warn",
    });

    expect(result).toEqual({
      kind: "notification",
      notificationId: "n-1",
      message: "Agent ready",
      level: "warn",
    });
  });

  it("rejects invalid queue payload", () => {
    expect(parseOcpInboundMessage(null)).toBe("invalid_payload");
    expect(parseOcpInboundMessage({ event: "queue_info" })).toBe("invalid_payload");
    expect(
      parseOcpInboundMessage({
        event: "queue_info",
        main_acallid: "x",
        queue_name: "  ",
      }),
    ).toBe("queue_name_required");
  });

  it("rejects unknown message kind", () => {
    expect(parseOcpInboundMessage({ event: "dlg_stop" })).toBe("unknown_message_kind");
  });
});
