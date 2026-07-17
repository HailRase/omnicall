/**
 * Account activation and telephony readiness are deliberately independent.
 * A local account session can remain active after SIP registration fails.
 */
export type AccountTelephonyOutcome =
  | Readonly<{ status: "ready" }>
  | Readonly<{
      status: "registration_failed";
      reasonKey: "account.error.sipRegistrationFailed";
    }>
  | Readonly<{ status: "in_progress" }>;

export type AccountSignInMetadataWarning =
  | "profile_save_failed"
  | "profile_touch_failed"
  | "password_save_failed";

export type AccountSignInOutcome = Readonly<{
  accountSession: "active";
  telephony: AccountTelephonyOutcome;
  metadataWarnings: ReadonlyArray<AccountSignInMetadataWarning>;
}>;

export function createReadyAccountSignInOutcome(
  metadataWarnings: ReadonlyArray<AccountSignInMetadataWarning> = [],
): AccountSignInOutcome {
  return {
    accountSession: "active",
    telephony: { status: "ready" },
    metadataWarnings,
  };
}

export function createSipRegistrationFailedAccountSignInOutcome(
  metadataWarnings: ReadonlyArray<AccountSignInMetadataWarning> = [],
): AccountSignInOutcome {
  return {
    accountSession: "active",
    telephony: {
      status: "registration_failed",
      reasonKey: "account.error.sipRegistrationFailed",
    },
    metadataWarnings,
  };
}
