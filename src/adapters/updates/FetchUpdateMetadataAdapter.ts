import { parseUpdateManifest } from "@domain/updates/parseUpdateManifest.js";
import type { UpdateManifest } from "@domain/updates/UpdateManifest.js";
import type { UpdateMetadataGateway } from "@ports/updates/UpdateMetadataGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

const MANIFEST_FETCH_TIMEOUT_MS = 15_000;

/**
 * - Purpose: fetch and validate remote update manifest via HTTP(S).
 * - Inputs: manifest URL from application configuration.
 * - Outputs: typed UpdateManifest or normalized fetch/parse errors.
 */
export class FetchUpdateMetadataAdapter implements UpdateMetadataGateway {
  async fetchManifest(manifestUrl: string): Promise<Result<UpdateManifest, PlatformError>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, MANIFEST_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(manifestUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        return err(
          createPlatformError("operation_failed", "Update manifest request failed", {
            status: response.status,
          }),
        );
      }

      const body: unknown = await response.json();
      const manifest = parseUpdateManifest(body);
      if (manifest === null) {
        return err(createPlatformError("validation_failed", "Update manifest is invalid"));
      }

      return ok(manifest);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return err(createPlatformError("timeout", "Update manifest request timed out"));
      }

      const message = error instanceof Error ? error.message : "Update manifest request failed";
      return err(createPlatformError("operation_failed", message));
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
