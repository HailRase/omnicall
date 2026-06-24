import type { SipAccountId } from "../shared/ids.js";

export type SipAccount = Readonly<{
  id: SipAccountId;
  uri: string;
  username: string;
  password: string;
  domain: string;
  server: string;
}>;

export type SipAccountInput = Readonly<{
  username: string;
  password: string;
  domain: string;
  server: string;
}>;

/**
 * - Purpose: normalize SIP domain from user input.
 * - Inputs: domain string (hostname or http/https URL).
 * - Outputs: SIP domain hostname for URI construction.
 */
export function normalizeSipDomain(domain: string): string {
  let sipDomain = domain.trim();
  if (sipDomain.length === 0) {
    return "";
  }

  if (sipDomain.startsWith("http://") || sipDomain.startsWith("https://")) {
    sipDomain = new URL(sipDomain).hostname;
  }

  return sipDomain;
}

/**
 * - Purpose: build SIP AOR URI from username and domain.
 * - Inputs: username and domain strings.
 * - Outputs: sip URI string (sip:user@domain).
 */
export function buildSipAccountUri(username: string, domain: string): string {
  const sipDomain = normalizeSipDomain(domain);
  return `sip:${username.trim()}@${sipDomain}`;
}

export function createSipAccount(
  id: SipAccountId,
  input: SipAccountInput,
): SipAccount {
  const domain = normalizeSipDomain(input.domain);
  return {
    id,
    uri: buildSipAccountUri(input.username, domain),
    username: input.username.trim(),
    password: input.password,
    domain,
    server: input.server.trim(),
  };
}

export function validateSipAccountInput(
  input: SipAccountInput,
): ReadonlyArray<string> {
  const errors: string[] = [];

  if (input.username.trim().length === 0) {
    errors.push("username_required");
  }

  if (normalizeSipDomain(input.domain).length === 0) {
    errors.push("domain_required");
  }

  if (input.server.trim().length === 0) {
    errors.push("server_required");
  }

  if (input.password.length === 0) {
    errors.push("password_required");
  }

  return errors;
}
