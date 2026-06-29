import { describe, expect, it } from "vitest";
import type { JsSipRtcSessionPort } from "./JsSipRtcSessionPort.js";
import { executeJsSipSendDtmf } from "./executeJsSipSendDtmf.js";

function createSession(
  behavior: "success" | "throw",
): JsSipRtcSessionPort & { sentTones: string[] } {
  const sentTones: string[] = [];
  return {
    id: "dtmf-session",
    sentTones,
    on: () => undefined,
    off: () => undefined,
    answer: () => undefined,
    terminate: () => undefined,
    hold: () => true,
    unhold: () => true,
    refer: () => false,
    sendDtmf: (tone: string) => {
      if (behavior === "throw") {
        throw new Error("INVALID_STATE_ERROR");
      }
      sentTones.push(tone);
    },
    getConnection: () => null,
    getRemoteIdentityHeader: () => '"Peer" <sip:100@pbx.example>',
  };
}

describe("executeJsSipSendDtmf", () => {
  it("sends tone through session port", () => {
    const session = createSession("success");
    const result = executeJsSipSendDtmf(session, "5");
    expect(result.ok).toBe(true);
    expect(session.sentTones).toEqual(["5"]);
  });

  it("maps session errors to operation_failed", () => {
    const session = createSession("throw");
    const result = executeJsSipSendDtmf(session, "1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("DTMF send failed");
    }
  });
});
