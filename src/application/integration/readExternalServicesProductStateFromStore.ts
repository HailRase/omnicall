/**
 * - Purpose: map committed renderer projections to External Services trigger facts.
 * - Inputs: structural account, optional OCP session, and call-focus projection slices.
 * - Outputs: typed snapshot or null when no active profile can receive automation.
 */
import type { SettingsAccountKey } from "@domain/index.js";
import type { ExternalServicesProductSnapshot } from "../services/integration/external-services/ExternalServicesProductSnapshot.js";

export type ExternalServicesStoreProjectionSlice = Readonly<{
  projection: Readonly<{
    hasActiveAccountSession: boolean;
    profileKey: SettingsAccountKey | null;
    sipUsername: string | null;
  }>;
  callFocusProjection: Readonly<{
    focusedCallId: string | null;
  }>;
  /** Optional: OCP connect login used when SIP username is not yet projected. */
  ocpSessionProjection?: Readonly<{
    authenticatedLogin: string | null;
  }>;
}>;

export function readExternalServicesProductStateFromStore(
  store: ExternalServicesStoreProjectionSlice,
): ExternalServicesProductSnapshot | null {
  if (!store.projection.hasActiveAccountSession || store.projection.profileKey === null) {
    return null;
  }
  const userLogin = resolveUserLogin(store);
  return {
    profileKey: store.projection.profileKey,
    focusedCallId: store.callFocusProjection.focusedCallId,
    ...(userLogin !== null ? { userLogin } : {}),
  };
}

function resolveUserLogin(
  store: ExternalServicesStoreProjectionSlice,
): string | null {
  const sipUsername = store.projection.sipUsername?.trim() ?? "";
  if (sipUsername.length > 0) {
    return sipUsername;
  }
  const ocpLogin = store.ocpSessionProjection?.authenticatedLogin?.trim() ?? "";
  return ocpLogin.length > 0 ? ocpLogin : null;
}
