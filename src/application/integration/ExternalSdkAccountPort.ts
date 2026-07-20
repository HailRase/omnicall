/**
 * Account activate port for SDK (DI-08). Secrets stay inside Facade / secure storage.
 */

import type { PlatformError } from "@shared/errors/index.js";
import type { Result } from "@shared/result/index.js";

export type SdkActivateProfileOutcome = Readonly<{
  mode: "sip_only" | "ocp";
  profileLabel?: string;
}>;

export type ExternalSdkAccountPort = Readonly<{
  /**
   * Resolve opaque profileRef → hydrate secrets desktop-only → unified signInAccount.
   * Never accepts or returns SIP password / OCP apiKey.
   */
  activateSavedProfile: (
    profileRef: string,
  ) => Promise<Result<SdkActivateProfileOutcome, PlatformError>>;
}>;
