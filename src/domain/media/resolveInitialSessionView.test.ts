import { describe, expect, it } from "vitest";
import { resolveInitialSessionView } from "./resolveInitialSessionView.js";

describe("resolveInitialSessionView", () => {
  it("keeps compact for audio mode", () => {
    expect(
      resolveInitialSessionView({
        mediaMode: "audio",
        remoteNumber: "vconf-sel-100",
        defaultSessionView: "expanded",
        autoFullscreenOnConference: true,
        conferenceNumberSubstring: "vconf-sel",
      }),
    ).toBe("compact");
  });

  it("uses defaultSessionView for video without conference match", () => {
    expect(
      resolveInitialSessionView({
        mediaMode: "video",
        remoteNumber: "1202",
        defaultSessionView: "expanded",
        autoFullscreenOnConference: true,
        conferenceNumberSubstring: "vconf-sel",
      }),
    ).toBe("expanded");
  });

  it("forces fullscreen when conference substring matches", () => {
    expect(
      resolveInitialSessionView({
        mediaMode: "video",
        remoteNumber: "vconf-sel-42",
        defaultSessionView: "compact",
        autoFullscreenOnConference: true,
        conferenceNumberSubstring: "vconf-sel",
      }),
    ).toBe("fullscreen");
  });
});
