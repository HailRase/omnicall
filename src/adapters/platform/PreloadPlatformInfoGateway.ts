import type {
  InstalledPlatformInfo,
  PlatformInfoGateway,
} from "@ports/updates/PlatformInfoGateway.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { UpdatePlatformId } from "@domain/updates/UpdateManifest.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";

const PLATFORM_IDS: ReadonlyArray<UpdatePlatformId> = ["win32", "darwin", "linux"];

function parsePlatformId(value: string): UpdatePlatformId | null {
  return PLATFORM_IDS.includes(value as UpdatePlatformId)
    ? (value as UpdatePlatformId)
    : null;
}

/**
 * - Purpose: renderer adapter for installed version via preload IPC (F-020).
 * - Inputs: none.
 * - Outputs: InstalledPlatformInfo from main process.
 */
export class PreloadPlatformInfoGateway implements PlatformInfoGateway {
  async getInstalledPlatformInfo(): Promise<Result<InstalledPlatformInfo, PlatformError>> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return err(createPlatformError("operation_failed", "Preload API is unavailable"));
    }

    const response = await softphone.getPlatformVersion();
    const platform = parsePlatformId(response.platform);
    if (platform === null) {
      return err(createPlatformError("operation_failed", "Unsupported platform"));
    }

    return ok({
      version: response.version,
      name: response.name,
      platform,
    });
  }
}
