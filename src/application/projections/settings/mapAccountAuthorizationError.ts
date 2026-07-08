import { mapSipRegistrationFailureKey } from "@domain/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { isLocalSavedProfileNotFoundError } from "./isLocalSavedProfileNotFoundError.js";
import { sanitizeRegistrationServerMessage } from "./sanitizeRegistrationServerMessage.js";

export type AccountAuthorizationErrorKey =
  | "account.error.invalidCredentials"
  | "account.error.networkOrTransport"
  | "account.error.profileNotFound"
  | "account.error.validationFailed"
  | "account.error.authorizationFailed"
  | "account.error.serverRegistration";

export type AccountAuthorizationErrorProjection = Readonly<{
  key: AccountAuthorizationErrorKey;
  params?: Readonly<{ detail: string }>;
}>;

/**
 * - Purpose: map account authorize/delete PlatformError values to UI message keys.
 * - Inputs: normalized PlatformError from facade authorize or profile delete paths.
 * - Outputs: semantic translation key with optional sanitized server detail params.
 */
export function mapAccountAuthorizationError(
  error: PlatformError,
): AccountAuthorizationErrorProjection {
  if (isLocalSavedProfileNotFoundError(error)) {
    return { key: "account.error.profileNotFound" };
  }

  if (error.code === "validation_failed") {
    return { key: "account.error.validationFailed" };
  }

  if (error.code === "timeout") {
    return { key: "account.error.networkOrTransport" };
  }

  if (error.code === "unauthorized") {
    return { key: "account.error.invalidCredentials" };
  }

  if (error.code === "forbidden") {
    return toServerRegistrationProjection(error.message);
  }

  if (error.code === "not_found") {
    return toServerRegistrationProjection(error.message);
  }

  return mapSipRegistrationFailureToAccountErrorProjection(
    mapSipRegistrationFailureKey(error.message),
    error.message,
  );
}

function mapSipRegistrationFailureToAccountErrorProjection(
  reasonKey: string,
  rawMessage: string,
): AccountAuthorizationErrorProjection {
  switch (reasonKey) {
    case "authentication_error":
      return { key: "account.error.invalidCredentials" };
    case "forbidden":
    case "not_found":
    case "registration_failed":
      return toServerRegistrationProjection(rawMessage);
    case "transport_connection_timed_out":
    case "connection_error":
    case "registration_timeout":
    case "service_unavailable":
      return { key: "account.error.networkOrTransport" };
    default:
      return { key: "account.error.authorizationFailed" };
  }
}

function toServerRegistrationProjection(
  rawMessage: string,
): AccountAuthorizationErrorProjection {
  return {
    key: "account.error.serverRegistration",
    params: { detail: sanitizeRegistrationServerMessage(rawMessage) },
  };
}
