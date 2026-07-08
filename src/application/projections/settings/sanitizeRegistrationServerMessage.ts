const CREDENTIAL_FRAGMENT_PATTERN =
  /password|secret|credential|token|authorization:\s*\S+/i;

const SIP_REGISTRATION_PREFIX_PATTERN = /^sip registration failed[^:]*:\s*/i;

/**
 * - Purpose: strip credentials and noise from SIP registration failure text.
 * - Inputs: raw gateway or platform error message.
 * - Outputs: safe user-facing server detail without secrets.
 */
export function sanitizeRegistrationServerMessage(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "Server registration failed";
  }

  if (CREDENTIAL_FRAGMENT_PATTERN.test(trimmed)) {
    return "Server registration failed";
  }

  const withoutPrefix = trimmed.replace(SIP_REGISTRATION_PREFIX_PATTERN, "").trim();
  const candidate = withoutPrefix.length > 0 ? withoutPrefix : trimmed;

  if (CREDENTIAL_FRAGMENT_PATTERN.test(candidate)) {
    return "Server registration failed";
  }

  if (candidate.length > 200) {
    return `${candidate.slice(0, 200)}…`;
  }

  return candidate;
}
