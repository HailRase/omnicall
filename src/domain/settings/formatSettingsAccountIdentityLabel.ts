import { normalizeSipDomain } from "../telephony/SipAccount.js";

/**
 * - Purpose: build user-visible SIP profile identity label without secrets.
 * - Inputs: SIP username and domain strings.
 * - Outputs: username@domain label or null when identity is incomplete.
 */
export function formatSettingsAccountIdentityLabel(
  username: string,
  domain: string,
): string | null {
  const normalizedUsername = username.trim();
  const normalizedDomain = normalizeSipDomain(domain);

  if (normalizedUsername.length === 0 || normalizedDomain.length === 0) {
    return null;
  }

  return `${normalizedUsername}@${normalizedDomain}`;
}
