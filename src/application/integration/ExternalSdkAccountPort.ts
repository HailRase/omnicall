/**
 * Account activate port for SDK (login path / ADR-0013 §B / ADR-0018 §E).
 * Secrets stay inside Facade / secure storage.
 */

import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type SdkActivateMode = "sip_only" | "ocp";

export type SdkActivateProfileOutcome = Readonly<{
  mode: SdkActivateMode;
  profileLabel?: string;
  alreadyAuthenticated?: boolean;
}>;

export type SdkActivateProfileLookup = Readonly<{
  profileId: string;
  profileLabel: string;
  username: string;
  availableModes: readonly SdkActivateMode[];
}>;

export type SdkActivateSessionView = Readonly<{
  signedIn: boolean;
  /** Current session login (SIP username / OCP login); null if signed out. */
  currentLogin: string | null;
  currentMode: SdkActivateMode | null;
  profileLabel: string | null;
}>;

export type ExternalSdkAccountPort = Readonly<{
  /**
   * Resolve login → approved saved profile + available complete auth modes.
   * Never returns secrets.
   */
  lookupSavedProfileByLogin: (
    login: string,
  ) => Promise<Result<SdkActivateProfileLookup, PlatformError>>;

  /**
   * Activate saved profile by login using an operator-chosen complete mode.
   */
  activateSavedProfileByLogin: (
    login: string,
    mode: SdkActivateMode,
  ) => Promise<Result<SdkActivateProfileOutcome, PlatformError>>;

  /**
   * Best-effort cancel of in-flight activate sign-in after auth budget expiry.
   * OCP: cancel attempt; sip_only: no-op / fail-closed without claiming success.
   */
  cancelInFlightActivateSignIn?: (
    mode: SdkActivateMode,
  ) => Promise<void> | void;

  /** Current account session projection for same-login / logout-required gates. */
  getActivateSessionView: () => SdkActivateSessionView;
}>;
