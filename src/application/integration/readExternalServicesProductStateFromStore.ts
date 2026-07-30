/**
 * - Purpose: map committed renderer projections to External Services trigger facts.
 * - Inputs: structural account and call-focus projection slices.
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
}>;

export function readExternalServicesProductStateFromStore(
  store: ExternalServicesStoreProjectionSlice,
): ExternalServicesProductSnapshot | null {
  if (!store.projection.hasActiveAccountSession || store.projection.profileKey === null) {
    return null;
  }
  const userLogin = store.projection.sipUsername;
  return {
    profileKey: store.projection.profileKey,
    focusedCallId: store.callFocusProjection.focusedCallId,
    ...(userLogin !== null && userLogin.length > 0 ? { userLogin } : {}),
  };
}
