import type { UpdatePlatformId } from "@domain/updates/UpdateManifest.js";
import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type InstalledPlatformInfo = Readonly<{
  version: string;
  name: string;
  platform: UpdatePlatformId;
}>;

/**
 * - Purpose: port for reading installed app version and OS platform (F-020).
 * - Inputs: none.
 * - Outputs: installed version metadata or normalized PlatformError.
 */
export interface PlatformInfoGateway {
  getInstalledPlatformInfo(): Promise<Result<InstalledPlatformInfo, PlatformError>>;
}
