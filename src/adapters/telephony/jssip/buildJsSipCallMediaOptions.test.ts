import { describe, expect, it } from "vitest";

import { buildJsSipCallMediaOptions } from "./buildJsSipCallMediaOptions.js";

describe("buildJsSipCallMediaOptions", () => {
  it("keeps default and explicit audio calls audio-only", () => {
    const expected = {
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      },
    };

    expect(buildJsSipCallMediaOptions()).toEqual(expected);
    expect(buildJsSipCallMediaOptions("audio")).toEqual(expected);
  });

  it("enables video capture and receive offer for video calls", () => {
    expect(buildJsSipCallMediaOptions("video")).toEqual({
      mediaConstraints: { audio: true, video: true },
      rtcOfferConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      },
    });
  });
});
