import { describe, expect, it } from "vitest";
import { parseUpdateManifest } from "./parseUpdateManifest.js";

const VALID_MANIFEST = {
  latestVersion: "1.2.0",
  downloadUrl: "https://example.com/releases",
  releaseDate: "2026-07-01",
  releaseNotesUrl: "https://example.com/releases/1.2.0",
  platforms: {
    win32: "https://example.com/win",
    darwin: "https://example.com/mac",
    linux: "https://example.com/linux",
  },
  minimumSupportedVersion: "1.0.0",
};

describe("parseUpdateManifest", () => {
  it("parses a valid manifest", () => {
    expect(parseUpdateManifest(VALID_MANIFEST)).toEqual(VALID_MANIFEST);
  });

  it("rejects non-https download URLs", () => {
    expect(
      parseUpdateManifest({
        ...VALID_MANIFEST,
        downloadUrl: "http://example.com/releases",
      }),
    ).toBeNull();
  });

  it("rejects missing latestVersion", () => {
    expect(parseUpdateManifest({ downloadUrl: "https://example.com/releases" })).toBeNull();
  });
});
