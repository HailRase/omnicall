import { describe, expect, it, vi } from "vitest";
import {
  createDefaultCodecPreferences,
  reorderAudioCodecs,
} from "@domain/index.js";
import { createTestLogger } from "@infrastructure/logging/TestLogger.js";
import { MockCodecPreferencesPort } from "@adapters/mock/MockCodecPreferencesPort.js";
import { resolveJsSipSessionCodecs } from "./resolveJsSipSessionCodecs.js";

describe("resolveJsSipSessionCodecs", () => {
  it("falls back to defaults when port is null", async () => {
    const resolved = await resolveJsSipSessionCodecs(
      null,
      createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
    );

    expect(resolved.audioMimeTypes[0]).toBe("audio/opus");
    expect(resolved.audioMimeTypes).toContain("audio/telephone-event");
  });

  it("returns port preferences when available", async () => {
    const reordered = reorderAudioCodecs(createDefaultCodecPreferences(), 0, 1);
    expect(reordered.ok).toBe(true);
    if (!reordered.ok) {
      throw new Error("expected reorder to succeed");
    }

    const port = new MockCodecPreferencesPort(reordered.value);
    const resolved = await resolveJsSipSessionCodecs(
      port,
      createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
    );

    expect(resolved.audioMimeTypes[0]).toBe("audio/PCMU");
    expect(resolved.audioMimeTypes[1]).toBe("audio/opus");
  });

  it("falls back to defaults when port throws", async () => {
    const port = {
      getCodecPreferences: vi.fn(() => Promise.reject(new Error("settings unavailable"))),
    };

    const resolved = await resolveJsSipSessionCodecs(
      port,
      createTestLogger({ featureId: "F-022", boundedContext: "Media" }),
    );

    expect(resolved.audioMimeTypes[0]).toBe("audio/opus");
  });
});
