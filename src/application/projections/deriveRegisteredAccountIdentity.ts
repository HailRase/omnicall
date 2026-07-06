import type { AccountBootstrapProjection } from "./accountBootstrapProjection.js";
import { deriveAuthShellFlags } from "./deriveAuthShellFlags.js";
import type { SettingsAccountIdentity } from "@domain/index.js";

/**
 * - Purpose: derive currently registered SIP identity from bootstrap projection.
 * - Inputs: account bootstrap projection after successful registration.
 * - Outputs: username/domain/server identity or null when not registered.
 */
export function deriveRegisteredAccountIdentity(
  projection: AccountBootstrapProjection,
): SettingsAccountIdentity | null {
  const { isSipRegistered } = deriveAuthShellFlags(projection);
  if (!isSipRegistered) {
    return null;
  }

  const username = projection.sipUsername?.trim() ?? "";
  if (username.length === 0) {
    return null;
  }

  return {
    username,
    domain: projection.sipDomain ?? "",
    server: projection.sipServer ?? "",
  };
}
