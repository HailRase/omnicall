import type { UpdateManifest } from "@domain/updates/UpdateManifest.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

/**
 * - Purpose: port for fetching remote update manifest metadata (F-020).
 * - Inputs: manifest URL from configuration.
 * - Outputs: parsed UpdateManifest or normalized PlatformError.
 */
export interface UpdateMetadataGateway {
  fetchManifest(manifestUrl: string): Promise<Result<UpdateManifest, PlatformError>>;
}
