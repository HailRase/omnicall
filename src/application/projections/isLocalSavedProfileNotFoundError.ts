import type { PlatformError } from "@shared/errors/index.js";

export const LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE =
  "saved account profile was not found";

/**
 * - Purpose: distinguish local saved-profile missing from SIP/server not_found.
 * - Inputs: normalized PlatformError from facade profile paths.
 * - Outputs: true when error refers to missing saved profile metadata.
 */
export function isLocalSavedProfileNotFoundError(error: PlatformError): boolean {
  if (error.code !== "not_found") {
    return false;
  }

  return error.message.trim().toLowerCase().includes(LOCAL_SAVED_PROFILE_NOT_FOUND_MESSAGE);
}
