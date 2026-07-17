/**
 * Account activation and telephony readiness are deliberately independent.
 * A local account session can remain active after SIP registration fails.
 */
export type AccountTelephonyOutcome =
  | Readonly<{ status: "ready" }>
  | Readonly<{
      status: "registration_failed";
      reasonKey: "account.error.sipRegistrationFailed";
      /** Raw gateway/platform message for Application error mapping (never a secret). */
      detail: string;
      /** True when SIP transport reached connected before registration failed (ADR-0004). */
      transportConnected: boolean;
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
  input: Readonly<{
    detail: string;
    transportConnected: boolean;
  }>,
  metadataWarnings: ReadonlyArray<AccountSignInMetadataWarning> = [],
): AccountSignInOutcome {
  return {
    accountSession: "active",
    telephony: {
      status: "registration_failed",
      reasonKey: "account.error.sipRegistrationFailed",
      detail: input.detail,
      transportConnected: input.transportConnected,
    },
    metadataWarnings,
  };
}
