import type { PhoneNumber, SipAccount } from "@domain/index.js";

/**
 * - Purpose: build SIP URI target for outbound JsSIP ua.call.
 * - Inputs: validated phone number and registered SIP account.
 * - Outputs: sip URI string for adapter call invocation.
 */
export function buildOutgoingSipTarget(
  phoneNumber: PhoneNumber,
  account: SipAccount,
): string {
  const normalized = phoneNumber.trim();
  if (normalized.toLowerCase().startsWith("sip:")) {
    return normalized;
  }

  return `sip:${normalized}@${account.domain}`;
}
