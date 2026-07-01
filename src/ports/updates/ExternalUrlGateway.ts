import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

/**
 * - Purpose: port for opening HTTPS URLs in the system browser (F-020).
 * - Inputs: validated HTTPS URL string.
 * - Outputs: success or normalized PlatformError from main process.
 */
export interface ExternalUrlGateway {
  openUrl(url: string): Promise<Result<void, PlatformError>>;
}
