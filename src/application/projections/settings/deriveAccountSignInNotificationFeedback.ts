import { createPlatformError } from "@shared/errors/index.js";
import type { AccountSignInOutcome } from "@domain/settings/AccountSignInOutcome.js";
import {
  mapAccountAuthorizationError,
  type AccountAuthorizationErrorProjection,
} from "./mapAccountAuthorizationError.js";

export type AccountSignInSuccessMessageKey =
  | "account.success.sipTransportConnected"
  | "account.success.sipRegistrationSucceeded"
  | "account.success.ocpAndSipReady"
  | "account.success.profileUpdated";

export type AccountSignInNotificationFeedback = Readonly<{
  successKeys: ReadonlyArray<AccountSignInSuccessMessageKey>;
  error: AccountAuthorizationErrorProjection | null;
  /** True for SIP transport/registration failures — toast CTA opens System State. */
  attachOpenSystemStateAction: boolean;
}>;

export type DeriveAccountSignInNotificationFeedbackInput = Readonly<{
  outcome: AccountSignInOutcome;
  mode: "sip_only" | "ocp";
  overwriteExistingCredentials?: boolean;
}>;

const SYSTEM_STATE_ERROR_KEYS = new Set<AccountAuthorizationErrorProjection["key"]>([
  "account.error.networkOrTransport",
  "account.error.serverRegistration",
  "account.error.invalidCredentials",
  "account.error.authorizationFailed",
]);

/**
 * - Purpose: map Account sign-in outcome to staged toast feedback (transport ≠ registration).
 * - Inputs: facade outcome, UI mode, overwrite flag.
 * - Outputs: ordered success keys, optional error projection, System State CTA flag.
 */
export function deriveAccountSignInNotificationFeedback(
  input: DeriveAccountSignInNotificationFeedbackInput,
): AccountSignInNotificationFeedback {
  if (input.overwriteExistingCredentials === true) {
    return {
      successKeys: ["account.success.profileUpdated"],
      error: null,
      attachOpenSystemStateAction: false,
    };
  }

  const telephony = input.outcome.telephony;

  if (telephony.status === "ready") {
    if (input.mode === "ocp") {
      return {
        successKeys: ["account.success.ocpAndSipReady"],
        error: null,
        attachOpenSystemStateAction: false,
      };
    }
    return {
      successKeys: [
        "account.success.sipTransportConnected",
        "account.success.sipRegistrationSucceeded",
      ],
      error: null,
      attachOpenSystemStateAction: false,
    };
  }

  if (telephony.status === "registration_failed") {
    const error = mapAccountAuthorizationError(
      createPlatformError("operation_failed", telephony.detail),
    );
    return {
      successKeys: telephony.transportConnected
        ? ["account.success.sipTransportConnected"]
        : [],
      error,
      attachOpenSystemStateAction: SYSTEM_STATE_ERROR_KEYS.has(error.key),
    };
  }

  return {
    successKeys: [],
    error: null,
    attachOpenSystemStateAction: false,
  };
}

/**
 * - Purpose: decide whether a mapped authorize PlatformError should offer System State CTA.
 */
export function shouldAttachOpenSystemStateAction(
  error: AccountAuthorizationErrorProjection,
): boolean {
  return SYSTEM_STATE_ERROR_KEYS.has(error.key);
}
