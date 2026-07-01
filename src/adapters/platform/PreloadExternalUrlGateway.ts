import type { ExternalUrlGateway } from "@ports/updates/ExternalUrlGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

/**
 * - Purpose: renderer adapter opening HTTPS URLs via preload IPC (F-020).
 * - Inputs: validated HTTPS URL.
 * - Outputs: IPC invoke result mapped to Result.
 */
export class PreloadExternalUrlGateway implements ExternalUrlGateway {
  async openUrl(url: string): Promise<Result<void, PlatformError>> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return err(createPlatformError("operation_failed", "Preload API is unavailable"));
    }

    const response = await softphone.openExternalUrl({ url });
    if (!response.ok) {
      return err(
        createPlatformError("operation_failed", response.reason ?? "Failed to open URL"),
      );
    }

    return ok(undefined);
  }
}
