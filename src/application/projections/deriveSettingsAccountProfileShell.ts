import { formatSettingsAccountIdentityLabel } from "@domain/index.js";
import type { AccountBootstrapProjection } from "./accountBootstrapProjection.js";
import { deriveAuthShellFlags } from "./deriveAuthShellFlags.js";

/**
 * - Purpose: derive renderer reload token when active profile settings should sync.
 * - Inputs: account bootstrap projection with SIP registration state.
 * - Outputs: composite identity key after successful registration, else null.
 */
export function deriveActiveProfileSettingsSyncKey(
  projection: AccountBootstrapProjection,
): string | null {
  const { isSipRegistered } = deriveAuthShellFlags(projection);

  if (!isSipRegistered) {
    return null;
  }

  return formatSettingsAccountIdentityLabel(
    projection.sipUsername ?? "",
    projection.sipDomain ?? "",
  );
}
