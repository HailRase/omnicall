import type { SavedAccountProfile } from "@domain/index.js";
import type { SipAccountInput } from "@domain/index.js";
import type { SettingsAccountIdentity } from "@domain/index.js";

/**
 * - Purpose: resolve SIP identity targeted by account authorize submit action.
 * - Inputs: account form values and optional selected saved profile.
 * - Outputs: complete identity for authorize or null when form is incomplete.
 */
export function resolveAccountAuthorizeTargetIdentity(
  form: SipAccountInput,
  selectedProfile: SavedAccountProfile | null,
): SettingsAccountIdentity | null {
  if (selectedProfile !== null) {
    return {
      username: selectedProfile.username,
      domain: selectedProfile.domain,
      server: selectedProfile.server,
    };
  }

  if (
    form.username.trim().length === 0 ||
    form.domain.trim().length === 0 ||
    form.server.trim().length === 0
  ) {
    return null;
  }

  return {
    username: form.username,
    domain: form.domain,
    server: form.server,
  };
}
