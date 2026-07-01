import type { UpdateManifest } from "@domain/updates/UpdateManifest.js";
import type { UpdateMetadataGateway } from "@ports/updates/UpdateMetadataGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

export type MockUpdateMetadataGatewayOptions = Readonly<{
  manifest?: UpdateManifest;
  error?: PlatformError;
  shouldReject?: boolean;
}>;

/**
 * - Purpose: deterministic UpdateMetadataGateway for application tests (F-020).
 * - Inputs: optional manifest fixture or configured error.
 * - Outputs: configured Result without network I/O.
 */
export class MockUpdateMetadataGateway implements UpdateMetadataGateway {
  private readonly options: MockUpdateMetadataGatewayOptions;
  public lastManifestUrl: string | null = null;

  constructor(options: MockUpdateMetadataGatewayOptions = {}) {
    this.options = options;
  }

  fetchManifest(manifestUrl: string): Promise<Result<UpdateManifest, PlatformError>> {
    this.lastManifestUrl = manifestUrl;

    if (this.options.shouldReject === true) {
      return Promise.resolve(err(createPlatformError("operation_failed", "Mock network failure")));
    }

    if (this.options.error !== undefined) {
      return Promise.resolve(err(this.options.error));
    }

    if (this.options.manifest === undefined) {
      return Promise.resolve(err(createPlatformError("validation_failed", "Mock manifest missing")));
    }

    return Promise.resolve(ok(this.options.manifest));
  }
}
