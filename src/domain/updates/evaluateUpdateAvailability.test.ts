import { describe, expect, it } from "vitest";
import { evaluateUpdateAvailability } from "./evaluateUpdateAvailability.js";

const manifest = {
  latestVersion: "1.2.0",
  downloadUrl: "https://example.com/releases",
  platforms: {
    win32: "https://example.com/win",
  },
} as const;

describe("evaluateUpdateAvailability", () => {
  it("reports update available when current is older", () => {
    const result = evaluateUpdateAvailability("1.0.0", manifest);
    expect(result.status).toBe("updateAvailable");
    expect(result.downloadUrl).toBe("https://example.com/releases");
  });

  it("reports up to date when current matches latest", () => {
    const result = evaluateUpdateAvailability("1.2.0", manifest);
    expect(result.status).toBe("upToDate");
  });

  it("reports invalid manifest version", () => {
    const result = evaluateUpdateAvailability("1.0.0", {
      ...manifest,
      latestVersion: "bad",
    });
    expect(result.status).toBe("invalidManifestVersion");
  });
});
