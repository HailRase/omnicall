import { describe, expect, it } from "vitest";

import { resolveVideoCallAvailability } from "./resolveVideoCallAvailability.js";

const readyBase = {
  numberValid: true,
  sipRegistered: true,
  secondSessionBlocked: false,
  holdAllInProgress: false,
  videoCaptureAvailable: true,
  videoFeatureReady: true,
} as const;

describe("resolveVideoCallAvailability", () => {
  it("keeps Video call disabled until feature ready (safe default)", () => {
    const result = resolveVideoCallAvailability({
      ...readyBase,
      videoFeatureReady: false,
    });
    expect(result).toEqual({
      enabled: false,
      reason: "videoCall.disabled.featureNotReady",
    });
  });

  it("enables Video call when all guards pass", () => {
    expect(resolveVideoCallAvailability(readyBase)).toEqual({ enabled: true });
  });

  it("returns first applicable disabled reason", () => {
    expect(
      resolveVideoCallAvailability({
        ...readyBase,
        numberValid: false,
      }),
    ).toEqual({
      enabled: false,
      reason: "videoCall.disabled.invalidNumber",
    });

    expect(
      resolveVideoCallAvailability({
        ...readyBase,
        sipRegistered: false,
      }),
    ).toEqual({
      enabled: false,
      reason: "videoCall.disabled.notRegistered",
    });

    expect(
      resolveVideoCallAvailability({
        ...readyBase,
        holdAllInProgress: true,
      }),
    ).toEqual({
      enabled: false,
      reason: "videoCall.disabled.holdAllInProgress",
    });

    expect(
      resolveVideoCallAvailability({
        ...readyBase,
        secondSessionBlocked: true,
      }),
    ).toEqual({
      enabled: false,
      reason: "videoCall.disabled.secondSessionBlocked",
    });

    expect(
      resolveVideoCallAvailability({
        ...readyBase,
        videoCaptureAvailable: false,
      }),
    ).toEqual({
      enabled: false,
      reason: "videoCall.disabled.captureUnavailable",
    });

    expect(
      resolveVideoCallAvailability({
        ...readyBase,
        remoteVideoOffered: false,
      }),
    ).toEqual({
      enabled: false,
      reason: "videoCall.disabled.remoteVideoNotOffered",
    });
  });
});
