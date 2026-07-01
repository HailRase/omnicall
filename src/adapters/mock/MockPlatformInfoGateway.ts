import type { InstalledPlatformInfo } from "@ports/updates/PlatformInfoGateway.js";
import type { PlatformInfoGateway } from "@ports/updates/PlatformInfoGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";

/**
 * - Purpose: deterministic PlatformInfoGateway for application tests (F-020).
 * - Inputs: configured installed platform info fixture.
 * - Outputs: fixed InstalledPlatformInfo without IPC.
 */
export class MockPlatformInfoGateway implements PlatformInfoGateway {
  constructor(private readonly info: InstalledPlatformInfo) {}

  getInstalledPlatformInfo(): Promise<Result<InstalledPlatformInfo, PlatformError>> {
    return Promise.resolve(ok(this.info));
  }
}

export function createUnavailablePlatformInfoGateway(): PlatformInfoGateway {
  return {
    getInstalledPlatformInfo(): Promise<Result<InstalledPlatformInfo, PlatformError>> {
      return Promise.resolve(
        err(createPlatformError("operation_failed", "Platform info unavailable")),
      );
    },
  };
}
