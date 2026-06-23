import { describe, expect, it } from "vitest";
import { createCallId } from "../../telephony/CallId.js";
import { createMainAcallId } from "../ocp/MainAcallId.js";
import { createOcpCallCorrelation } from "../ocp/OcpCallCorrelation.js";
import { matchQueueInfoToCall } from "./matchQueueInfoToCall.js";

describe("matchQueueInfoToCall", () => {
  const callId = createCallId("call-1");
  const mainAcallId = createMainAcallId("acall-100");
  const correlations = [createOcpCallCorrelation(callId, mainAcallId)];

  it("returns sip_only when OCP mode is off", () => {
    const result = matchQueueInfoToCall({
      isOcpMode: false,
      queueMainAcallId: mainAcallId,
      knownCorrelations: correlations,
    });

    expect(result).toEqual({ ok: false, reason: "sip_only" });
  });

  it("matches exact main_acallid to callId", () => {
    const result = matchQueueInfoToCall({
      isOcpMode: true,
      queueMainAcallId: mainAcallId,
      knownCorrelations: correlations,
    });

    expect(result).toEqual({ ok: true, callId });
  });

  it("rejects substring main_acallid match", () => {
    const partial = createMainAcallId("acall-10");
    const result = matchQueueInfoToCall({
      isOcpMode: true,
      queueMainAcallId: partial,
      knownCorrelations: correlations,
    });

    expect(result).toEqual({ ok: false, reason: "main_acallid_mismatch" });
  });

  it("returns no_correlation when id is unrelated", () => {
    const unrelated = createMainAcallId("acall-999");
    const result = matchQueueInfoToCall({
      isOcpMode: true,
      queueMainAcallId: unrelated,
      knownCorrelations: correlations,
    });

    expect(result).toEqual({ ok: false, reason: "no_correlation" });
  });
});
