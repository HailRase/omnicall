/**
 * Map PlatformError → stable protocol codes (DI-06/DI-08). No ad hoc strings.
 */

import type { ProtocolErrorCode } from "@axata/axatalk-protocol";
import { ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE } from "@application/facades/accountSignInCommand.js";
import type { PlatformError } from "@shared/errors/index.js";

export function mapPlatformErrorToSdkCode(
  error: PlatformError,
): ProtocolErrorCode {
  if (
    error.code === "validation_failed" &&
    (error.message === "ocp_logout_reason_required" ||
      isCauseReason(error.cause, "ocp_logout_reason_required"))
  ) {
    return "interaction_required";
  }
  if (
    error.message === ACCOUNT_SIGN_IN_LOGOUT_REQUIRED_MESSAGE ||
    isCauseReason(error.cause, "account.signIn.disabled.logoutFirst")
  ) {
    return "conflict";
  }
  switch (error.code) {
    case "validation_failed":
      return "invalid_payload";
    case "not_found":
      return "not_found";
    case "forbidden":
    case "unauthorized":
      return "forbidden";
    case "timeout":
      return "timeout";
    case "cancelled":
      return "conflict";
    case "not_implemented":
      return "unsupported_command";
    case "operation_failed":
    case "unknown":
    default:
      return "operation_failed";
  }
}

function isCauseReason(cause: unknown, reason: string): boolean {
  if (typeof cause !== "object" || cause === null) {
    return false;
  }
  return (cause as Record<string, unknown>)["reason"] === reason;
}
