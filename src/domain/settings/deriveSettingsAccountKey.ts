import { normalizeSipDomain } from "../telephony/SipAccount.js";
import {
  ANONYMOUS_SETTINGS_ACCOUNT,
  createSettingsAccountKey,
  type SettingsAccountKey,
} from "./SettingsAccountKey.js";

export type SettingsAccountIdentity = Readonly<{
  username: string;
  domain: string;
  server: string;
}>;

const SERVER_HOST_SUFFIX_SEPARATOR = "|" as const;

/**
 * - Purpose: normalize username segment for stable profile key derivation.
 * - Inputs: raw SIP username or agent id string.
 * - Outputs: trimmed lowercase username.
 */
export function normalizeSettingsAccountUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * - Purpose: normalize domain segment for stable profile key derivation.
 * - Inputs: SIP domain or URL-shaped domain input.
 * - Outputs: trimmed lowercase SIP domain hostname.
 */
export function normalizeSettingsAccountDomain(domain: string): string {
  return normalizeSipDomain(domain).toLowerCase();
}

/**
 * - Purpose: extract hostname from SIP transport/server input for profile key suffix.
 * - Inputs: WebSocket URL, host:port, or bare hostname.
 * - Outputs: lowercase hostname; empty when input is blank or unparseable.
 */
export function extractSipServerHost(server: string): string {
  const trimmed = server.trim();
  if (trimmed.length === 0) {
    return "";
  }

  const lower = trimmed.toLowerCase();

  if (
    lower.startsWith("ws://") ||
    lower.startsWith("wss://") ||
    lower.startsWith("http://") ||
    lower.startsWith("https://")
  ) {
    try {
      return new URL(trimmed).hostname.toLowerCase();
    } catch {
      return parseBareServerHost(trimmed);
    }
  }

  if (lower.startsWith("sip:") || lower.startsWith("sips:")) {
    const withoutScheme = trimmed.replace(/^sips?:\/\//iu, "").replace(/^sips?:/iu, "");
    const authority = withoutScheme.split(/[;/]/u)[0] ?? "";
    const hostSegment = authority.includes("@")
      ? (authority.split("@").pop() ?? authority)
      : authority;
    return parseBareServerHost(hostSegment);
  }

  return parseBareServerHost(trimmed);
}

/**
 * - Purpose: derive deterministic settings profile key from SIP identity fields.
 * - Inputs: username, domain, server (password excluded).
 * - Outputs: branded SettingsAccountKey with optional server-host suffix.
 */
export function deriveSettingsAccountKeyFromIdentity(
  identity: SettingsAccountIdentity,
): SettingsAccountKey {
  const username = normalizeSettingsAccountUsername(identity.username);
  const domain = normalizeSettingsAccountDomain(identity.domain);

  if (username.length === 0 || domain.length === 0) {
    return createSettingsAccountKey(ANONYMOUS_SETTINGS_ACCOUNT);
  }

  const baseKey = `${username}@${domain}`;
  const serverHost = extractSipServerHost(identity.server);

  if (serverHost.length === 0 || serverHost === domain) {
    return createSettingsAccountKey(baseKey);
  }

  return createSettingsAccountKey(`${baseKey}${SERVER_HOST_SUFFIX_SEPARATOR}${serverHost}`);
}

function parseBareServerHost(value: string): string {
  const hostPart = value.split("/")[0] ?? "";
  const host = (hostPart.split(":")[0] ?? "").trim().toLowerCase();
  return host;
}
