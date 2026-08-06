import { describe, expect, it } from "vitest";

import {
  parseSdkBrokerAckResponse,
  parseSdkBrokerClientSessionEndedIpcPayload,
  parseSdkBrokerReadyIpcPayload,
  parseSdkBrokerReplyIpcPayload,
  parseSdkBrokerRequestIpcPayload,
} from "./SdkBrokerContract.js";

describe("SdkBrokerContract parsers", () => {
  it("accepts a valid request envelope", () => {
    expect(
      parseSdkBrokerRequestIpcPayload({
        brokerRequestId: "brk_1",
        command: { kind: "command", type: "sdk:ping" },
      }),
    ).toEqual({
      brokerRequestId: "brk_1",
      command: { kind: "command", type: "sdk:ping" },
    });
  });

  it("fails closed on malformed request envelopes", () => {
    expect(parseSdkBrokerRequestIpcPayload(null)).toBeNull();
    expect(parseSdkBrokerRequestIpcPayload({})).toBeNull();
    expect(
      parseSdkBrokerRequestIpcPayload({ brokerRequestId: "", command: {} }),
    ).toBeNull();
    expect(
      parseSdkBrokerRequestIpcPayload({ brokerRequestId: "brk_1" }),
    ).toBeNull();
  });

  it("accepts success and failure reply envelopes", () => {
    expect(
      parseSdkBrokerReplyIpcPayload({
        brokerRequestId: "brk_1",
        ok: true,
        reply: { kind: "reply" },
      }),
    ).toEqual({
      brokerRequestId: "brk_1",
      ok: true,
      reply: { kind: "reply" },
    });
    expect(
      parseSdkBrokerReplyIpcPayload({
        brokerRequestId: "brk_1",
        ok: false,
        code: "timeout",
      }),
    ).toEqual({
      brokerRequestId: "brk_1",
      ok: false,
      code: "timeout",
    });
  });

  it("fails closed on malformed reply envelopes", () => {
    expect(
      parseSdkBrokerReplyIpcPayload({
        brokerRequestId: "brk_1",
        ok: false,
        code: "not_a_real_code",
      }),
    ).toBeNull();
    expect(
      parseSdkBrokerReplyIpcPayload({
        brokerRequestId: "brk_1",
        ok: true,
      }),
    ).toBeNull();
  });

  it("parses ready and ack payloads", () => {
    expect(parseSdkBrokerReadyIpcPayload({ ready: true })).toEqual({
      ready: true,
    });
    expect(parseSdkBrokerReadyIpcPayload({ ready: "yes" })).toBeNull();
    expect(parseSdkBrokerAckResponse({ ok: true })).toEqual({ ok: true });
    expect(parseSdkBrokerAckResponse({ ok: 1 })).toBeNull();
  });

  it("parses client-session-ended payload", () => {
    expect(
      parseSdkBrokerClientSessionEndedIpcPayload({
        clientId: "client_a",
        origin: "https://crm.example.com",
      }),
    ).toEqual({
      clientId: "client_a",
      origin: "https://crm.example.com",
    });
    expect(parseSdkBrokerClientSessionEndedIpcPayload({})).toBeNull();
    expect(
      parseSdkBrokerClientSessionEndedIpcPayload({ clientId: "" }),
    ).toBeNull();
    expect(
      parseSdkBrokerClientSessionEndedIpcPayload({ clientId: "client_a" }),
    ).toBeNull();
  });
});
