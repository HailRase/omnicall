import { mapSipRegistrationFailureKey } from "@domain/index.js";
import type { PlatformError } from "@shared/errors/index.js";

const SIP_PASSWORD_REQUIRED_MESSAGE = "SIP password is required";

const SECRET_STORAGE_FAILURE_REASONS = [
  "secret_load_failed",
  "encryption_unavailable",
  "invalid_secret_storage_response",
  "secret_storage_error",
] as const;

function isSecretStorageLoadFailure(error: PlatformError): boolean {
  const normalizedMessage = error.message.trim().toLowerCase();
  return SECRET_STORAGE_FAILURE_REASONS.some((reason) =>
    normalizedMessage.includes(reason),
  );
}

/**
 * - Purpose: decide whether remembered-password sign-in failure should reveal manual password entry.
 * - Inputs: normalized PlatformError from saved profile authorize path.
 * - Outputs: true when user should enter password manually; false for server/policy errors.
 */
export function shouldRevealPasswordEntryAfterRememberedSignInFailure(
  error: PlatformError,
): boolean {
  if (error.code === "unauthorized") {
    return true;
  }

  if (error.code === "validation_failed" && error.message === SIP_PASSWORD_REQUIRED_MESSAGE) {
    return true;
  }

  if (isSecretStorageLoadFailure(error)) {
    return true;
  }

  return mapSipRegistrationFailureKey(error.message) === "authentication_error";
}
