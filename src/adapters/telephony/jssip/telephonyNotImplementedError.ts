import { createPlatformError } from "@shared/errors/index.js";
import type { PlatformError } from "@shared/errors/index.js";

/**
 * - Purpose: typed stub error for TelephonyGateway methods deferred to later RAT steps.
 * - Inputs: telephony operation name.
 * - Outputs: PlatformError with code not_implemented.
 */
export function telephonyNotImplementedError(operation: string): PlatformError {
  return createPlatformError(
    "not_implemented",
    `Telephony operation not implemented: ${operation}`,
  );
}
