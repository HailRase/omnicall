import { describe, expect, it } from "vitest";

import { OperatorStatus } from "../OperatorStatus.js";
import type { OcpCommand } from "./OcpCommand.js";
import type { OcpIncomingMessage } from "./OcpIncomingMessage.js";

function describeOcpCommandKind(cmd: OcpCommand): string {
  switch (cmd.kind) {
    case "auth":
      return cmd.kind;
    case "change_status_to_ready":
      return cmd.kind;
    case "change_status_to_break":
      return cmd.kind;
    case "change_status_to_logout":
      return cmd.kind;
    case "update_post_call_status":
      return cmd.kind;
    case "get_main_acallid":
      return cmd.kind;
    case "dlg_stop":
      return cmd.kind;
    case "campaign_accept":
      return cmd.kind;
    case "campaign_reject":
      return cmd.kind;
    case "logging":
      return cmd.kind;
    default: {
      const exhaustive: never = cmd;
      return exhaustive;
    }
  }
}

function describeOcpIncomingEntity(msg: OcpIncomingMessage): string {
  switch (msg.entity) {
    case "creds":
      return msg.entity;
    case "users":
      return msg.entity;
    case "operator_status_reasons":
      return msg.entity;
    case "notification":
      return msg.entity;
    case "terminate":
      return msg.entity;
    case "campaign_events":
      return msg.entity;
    case "calls":
      return msg.entity;
    case "Error":
      return msg.entity;
    default: {
      const exhaustive: never = msg;
      return exhaustive;
    }
  }
}

describe("Ocp protocol exhaustive unions", () => {
  it("covers every OcpCommand kind at runtime", () => {
    const commands: OcpCommand[] = [
      { kind: "auth", token: "token" },
      {
        kind: "change_status_to_ready",
        operatorId: 1,
        reasonId: 2,
        callType: "internal",
      },
      {
        kind: "change_status_to_break",
        operatorId: 1,
        reasonId: 2,
        callType: "external",
      },
      {
        kind: "change_status_to_logout",
        operatorId: 1,
        reasonId: 2,
        callType: "sdk",
      },
      {
        kind: "update_post_call_status",
        operatorId: 1,
        reasonId: 2,
        reservedStatus: OperatorStatus.READY,
      },
      { kind: "get_main_acallid", callId: "call-1" },
      { kind: "dlg_stop", callId: "call-1", acallId: "acall-1" },
      { kind: "campaign_accept", operatorId: 1, campaignEventId: "evt-1" },
      { kind: "campaign_reject", operatorId: 1, campaignEventId: "evt-1" },
      { kind: "logging", payload: { action: "test" } },
    ];

    expect(commands.map(describeOcpCommandKind)).toHaveLength(commands.length);
  });

  it("covers every OcpIncomingMessage entity at runtime", () => {
    const messages: OcpIncomingMessage[] = [
      {
        entity: "creds",
        data: { username: "u", password: "p", domain: "d", server: "s" },
      },
      {
        entity: "users",
        data: {
          operatorId: 1,
          status: OperatorStatus.READY,
          reasonId: 0,
          statusSince: "2026-07-13T10:00:00.000Z",
        },
      },
      {
        entity: "operator_status_reasons",
        data: [
          {
            id: 1,
            parentStatus: OperatorStatus.BREAK,
            defaultDescription: "Break",
            timeDelta: null,
          },
        ],
      },
      {
        entity: "notification",
        data: {
          id: "n-1",
          uuid: undefined,
          type: "notify",
          body: "Hello",
          time: 1,
          blocked: false,
          deleted: false,
          position: "top-right",
        },
      },
      { entity: "terminate" },
      {
        entity: "campaign_events",
        data: {
          id: "c-1",
          callId: "call-1",
          queueId: "q-1",
          abonentId: "a-1",
          companyId: "co-1",
          queueTitle: "Queue",
          selectionId: "s-1",
          isAnswered: false,
          progressive: true,
          clientPhone: "+1",
          companyTitle: "Company",
          strategyTitle: "Strategy",
          selectionTitle: "Selection",
          strategyCallId: "sc-1",
        },
      },
      {
        entity: "calls",
        data: {
          acallId: "acall-1",
          event: "incomingCallProgress",
          callerId: "1",
          calledId: "2",
          queue: "support",
        },
      },
      { entity: "Error", data: { code: "SESSION_EXIST" } },
    ];

    expect(messages.map(describeOcpIncomingEntity)).toHaveLength(messages.length);
  });
});
