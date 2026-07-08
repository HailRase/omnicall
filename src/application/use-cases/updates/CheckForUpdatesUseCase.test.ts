import { describe, expect, it } from "vitest";
import { CheckForUpdatesUseCase } from "./CheckForUpdatesUseCase.js";
import {
  MockExternalUrlGateway,
  MockPlatformInfoGateway,
  MockUpdateMetadataGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import { createPlatformError } from "@shared/errors/index.js";

const manifest = {
  latestVersion: "2.0.0",
  downloadUrl: "https://example.com/releases",
} as const;

function createUseCase(
  manifestGateway: MockUpdateMetadataGateway,
  platform = { version: "1.0.0", name: "Enterprise Softphone", platform: "win32" as const },
) {
  return new CheckForUpdatesUseCase(
    manifestGateway,
    new MockPlatformInfoGateway(platform),
    new MockExternalUrlGateway(),
    createTestLogger({ featureId: "F-020", boundedContext: "Integration" }),
  );
}

describe("CheckForUpdatesUseCase", () => {
  it("reports update available", async () => {
    const useCase = createUseCase(new MockUpdateMetadataGateway({ manifest }));
    const result = await useCase.execute({
      manifestUrl: "https://example.com/manifest.json",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.status).toBe("updateAvailable");
    expect(result.value.latestVersion).toBe("2.0.0");
  });

  it("reports up to date", async () => {
    const useCase = createUseCase(
      new MockUpdateMetadataGateway({ manifest: { ...manifest, latestVersion: "1.0.0" } }),
    );
    const result = await useCase.execute({
      manifestUrl: "https://example.com/manifest.json",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.status).toBe("upToDate");
  });

  it("reports invalid manifest", async () => {
    const useCase = createUseCase(
      new MockUpdateMetadataGateway({
        error: createPlatformError("validation_failed", "invalid"),
      }),
    );
    const result = await useCase.execute({
      manifestUrl: "https://example.com/manifest.json",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.status).toBe("invalidManifest");
  });

  it("reports network error without throwing", async () => {
    const useCase = createUseCase(new MockUpdateMetadataGateway({ shouldReject: true }));
    const result = await useCase.execute({
      manifestUrl: "https://example.com/manifest.json",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.status).toBe("error");
  });

  it("reports unavailable when manifest URL is missing", async () => {
    const useCase = createUseCase(new MockUpdateMetadataGateway({ manifest }));
    const result = await useCase.execute({ manifestUrl: null });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.status).toBe("unavailable");
    expect(result.value.currentVersion).toBe("1.0.0");
  });

  it("opens download page through external URL gateway", async () => {
    const externalUrlGateway = new MockExternalUrlGateway();
    const useCase = new CheckForUpdatesUseCase(
      new MockUpdateMetadataGateway({ manifest }),
      new MockPlatformInfoGateway({
        version: "1.0.0",
        name: "Enterprise Softphone",
        platform: "win32",
      }),
      externalUrlGateway,
      createTestLogger({ featureId: "F-020", boundedContext: "Integration" }),
    );

    const result = await useCase.openDownloadPage({
      downloadUrl: "https://example.com/releases",
    });

    expect(result.ok).toBe(true);
    expect(externalUrlGateway.openedUrls).toEqual(["https://example.com/releases"]);
  });
});
