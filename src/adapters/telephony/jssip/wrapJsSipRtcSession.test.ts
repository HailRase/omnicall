import { describe, expect, it } from "vitest";
import type { RTCSession } from "@hailrase/jssip/lib/RTCSession.js";
import {
  resolveReplacesForRefer,
  resolveReplacesRtcSession,
  resolveReplacesStorageTarget,
  wrapJsSipRtcSession,
} from "./wrapJsSipRtcSession.js";
import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";

function createDialogRtcSession(id: string): RTCSession {
  return {
    id,
    _request: { call_id: `call-${id}` },
    _to_tag: "remote-tag",
    _from_tag: "local-tag",
    remote_identity: { toString: () => `"Peer" <sip:${id}@pbx.example>` },
    connection: null,
    on: () => undefined,
    off: () => undefined,
    answer: () => undefined,
    terminate: () => undefined,
    hold: () => true,
    unhold: () => true,
    refer: () => false,
    sendDTMF: () => undefined,
  } as unknown as RTCSession;
}

describe("wrapJsSipRtcSession replaces resolution", () => {
  it("resolves raw RTCSession from wrapped port for Replaces header", () => {
    const raw = createDialogRtcSession("consult-1");
    const port = wrapJsSipRtcSession(raw);

    expect(resolveReplacesRtcSession(port)).toBe(raw);
    expect(resolveReplacesForRefer(port)).toBe(raw);
    expect(resolveReplacesStorageTarget(raw)).toBe(raw);
  });

  it("keeps adapter test ports when dialog fields are unavailable", () => {
    const port: JsSipRtcSessionPort = {
      id: "mock-consult",
      on: () => undefined,
      off: () => undefined,
      answer: () => undefined,
      terminate: () => undefined,
      hold: () => true,
      unhold: () => true,
      refer: () => false,
      sendDtmf: () => undefined,
      getConnection: () => null,
      getRemoteIdentityHeader: () => '"Peer" <sip:mock@pbx.example>',
    };

    expect(resolveReplacesForRefer(port)).toBe(port);
    expect(resolveReplacesStorageTarget(port)).toBe(port);
  });
});
