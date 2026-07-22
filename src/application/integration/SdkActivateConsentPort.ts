/**
 * Application port for per-request saved-profile activation consent (login path).
 */

import type { SdkActivateMode } from "./ExternalSdkAccountPort.js";

export type SdkActivateConsentKind =
  | "activate"
  | "reauthorize"
  | "logout_required";

export type SdkActivateConsentRequest = Readonly<{
  kind: SdkActivateConsentKind;
  origin: string;
  login: string;
  profileLabel: string;
  availableModes: readonly SdkActivateMode[];
  preferredMode?: SdkActivateMode;
}>;

export type SdkActivateConsentDecision =
  | Readonly<{ decision: "allow"; mode: SdkActivateMode }>
  | Readonly<{ decision: "deny" }>
  | Readonly<{ decision: "dismiss" }>;

export type SdkActivateConsentPort = Readonly<{
  requestConsent(
    input: SdkActivateConsentRequest,
  ): Promise<SdkActivateConsentDecision>;
  /**
   * Informational logout-required modal (SDK already received conflict).
   * Does not block the command reply.
   */
  notifyLogoutRequired?(input: {
    readonly origin: string;
    readonly login: string;
    readonly profileLabel: string;
    readonly currentProfileLabel: string | null;
  }): void;
}>;
