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

  const host = extractSipDomainHost(account.registrar);
  return `sip:${normalized}@${host}`;
}

function extractSipDomainHost(registrar: string): string {
  const trimmed = registrar.trim();
  if (trimmed.length === 0) {
    return "localhost";
  }

  try {
    const url = new URL(
      trimmed.startsWith("ws") || trimmed.startsWith("http")
        ? trimmed
        : `wss://${trimmed}`,
    );
    return url.hostname;
  } catch {
    return trimmed.replace(/^wss?:\/\//u, "").split("/")[0]?.split(":")[0] ?? "localhost";
  }
}
