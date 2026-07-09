import { describe, expect, it } from "vitest";

import {
  CALL_MEDIA_MODES,
  DEFAULT_CALL_MEDIA_MODE,
  isCallMediaMode,
  parseCallMediaMode,
} from "./CallMediaMode.js";

describe("CallMediaMode", () => {
  it("defaults to audio for safe SIP path", () => {
    expect(DEFAULT_CALL_MEDIA_MODE).toBe("audio");
    expect(CALL_MEDIA_MODES).toEqual(["audio", "video"]);
  });

  it("parses known modes and rejects unknown", () => {
    expect(isCallMediaMode("audio")).toBe(true);
    expect(isCallMediaMode("video")).toBe(true);
    expect(parseCallMediaMode("video")).toBe("video");
    expect(parseCallMediaMode("screen")).toBeNull();
    expect(parseCallMediaMode(1)).toBeNull();
  });
});
