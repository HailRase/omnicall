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

export type AccountSignInErrorPresentation = "inline_alert" | "notification";

export type AccountSignInNotificationFeedback = Readonly<{
  successKeys: ReadonlyArray<AccountSignInSuccessMessageKey>;
  /** Validation / form-owned errors — AccountPanel Alert only. */
  inlineError: AccountAuthorizationErrorProjection | null;
  /** Server / transport / register failures — toast + journal; never Alert. */
  notificationError: AccountAuthorizationErrorProjection | null;
  /** True for notification-class SIP transport/registration failures. */
  attachOpenSystemStateAction: boolean;
}>;

export type AccountSignInErrorChannelAssignment = Readonly<{
  inlineError: AccountAuthorizationErrorProjection | null;
  notificationError: AccountAuthorizationErrorProjection | null;
  attachOpenSystemStateAction: boolean;
}>;

export type DeriveAccountSignInNotificationFeedbackInput = Readonly<{
  outcome: AccountSignInOutcome;
  mode: "sip_only" | "ocp";
  overwriteExistingCredentials?: boolean;
}>;

const INLINE_ALERT_ERROR_KEYS = new Set<AccountAuthorizationErrorProjection["key"]>([
  "account.error.validationFailed",
  "account.error.profileNotFound",
]);

const SYSTEM_STATE_ERROR_KEYS = new Set<AccountAuthorizationErrorProjection["key"]>([
  "account.error.networkOrTransport",
  "account.error.serverRegistration",
  "account.error.invalidCredentials",
  "account.error.authorizationFailed",
]);

/**
 * - Purpose: classify Account sign-in mapped errors into Alert vs notification channel.
 * - Inputs: mapped authorization error projection.
 * - Outputs: `inline_alert` (form) or `notification` (server/register/transport).
 */
export function classifyAccountSignInErrorPresentation(
  error: AccountAuthorizationErrorProjection,
): AccountSignInErrorPresentation {
  if (INLINE_ALERT_ERROR_KEYS.has(error.key)) {
    return "inline_alert";
  }
  return "notification";
}

/**
 * - Purpose: assign a mapped Account error to exactly one presentational channel.
 * - Inputs: mapped error; optional suppress when another surface owns UX (OCP modal).
 * - Outputs: inline vs notification slots + System State CTA flag (notification only).
 */
export function assignAccountSignInErrorChannels(
  error: AccountAuthorizationErrorProjection,
  options: Readonly<{ suppressNotification?: boolean }> = {},
): AccountSignInErrorChannelAssignment {
  if (classifyAccountSignInErrorPresentation(error) === "inline_alert") {
    return {
      inlineError: error,
      notificationError: null,
      attachOpenSystemStateAction: false,
    };
  }
  if (options.suppressNotification === true) {
    return {
      inlineError: null,
      notificationError: null,
      attachOpenSystemStateAction: false,
    };
  }
  return {
    inlineError: null,
    notificationError: error,
    attachOpenSystemStateAction: SYSTEM_STATE_ERROR_KEYS.has(error.key),
  };
}

/**
 * - Purpose: map Account sign-in outcome to staged toast feedback (transport ≠ registration).
 * - Inputs: facade outcome, UI mode, overwrite flag.
 * - Outputs: ordered success keys, channel-split errors, System State CTA flag.
 */
export function deriveAccountSignInNotificationFeedback(
  input: DeriveAccountSignInNotificationFeedbackInput,
): AccountSignInNotificationFeedback {
  if (input.overwriteExistingCredentials === true) {
    return {
      successKeys: ["account.success.profileUpdated"],
      inlineError: null,
      notificationError: null,
      attachOpenSystemStateAction: false,
    };
  }

  const telephony = input.outcome.telephony;

  if (telephony.status === "ready") {
    if (input.mode === "ocp") {
      return {
        successKeys: ["account.success.ocpAndSipReady"],
        inlineError: null,
        notificationError: null,
        attachOpenSystemStateAction: false,
      };
    }
    return {
      successKeys: [
        "account.success.sipTransportConnected",
        "account.success.sipRegistrationSucceeded",
      ],
      inlineError: null,
      notificationError: null,
      attachOpenSystemStateAction: false,
    };
  }

  if (telephony.status === "registration_failed") {
    const mapped = mapAccountAuthorizationError(
      createPlatformError("operation_failed", telephony.detail),
    );
    const channels = assignAccountSignInErrorChannels(mapped);
    return {
      successKeys: telephony.transportConnected
        ? ["account.success.sipTransportConnected"]
        : [],
      inlineError: channels.inlineError,
      notificationError: channels.notificationError,
      attachOpenSystemStateAction: channels.attachOpenSystemStateAction,
    };
  }

  return {
    successKeys: [],
    inlineError: null,
    notificationError: null,
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
