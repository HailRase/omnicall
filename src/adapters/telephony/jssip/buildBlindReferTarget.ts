import type { PhoneNumber, SipAccount } from "@domain/index.js";

export type ReferTargetKind = "on_net" | "off_net";

/** Short PBX extensions (smoke PASS on dev SBC with sip:user@domain). */
const ON_NET_MAX_EXTENSION_LENGTH = 5;

/** National / PSTN digit length threshold for off-net classification. */
const OFF_NET_MIN_DIGIT_LENGTH = 10;

/**
 * - Purpose: classify blind REFER target as on-net extension or off-net PSTN.
 * - Inputs: validated phone number from transfer command.
 * - Outputs: refer target kind for adapter URI construction.
 */
export function classifyReferTargetKind(phoneNumber: PhoneNumber): ReferTargetKind {
  const normalized = phoneNumber.trim();

  if (normalized.toLowerCase().startsWith("sip:")) {
    return "on_net";
  }

  const digitsOnly = normalized.startsWith("+") ? normalized.slice(1) : normalized;
  if (!/^[0-9]+$/.test(digitsOnly)) {
    return "off_net";
  }

  if (digitsOnly.length <= ON_NET_MAX_EXTENSION_LENGTH) {
    return "on_net";
  }

  if (normalized.startsWith("+")) {
    return "off_net";
  }

  if (digitsOnly.length >= OFF_NET_MIN_DIGIT_LENGTH) {
    return "off_net";
  }

  return "on_net";
}

/**
 * - Purpose: build Refer-To URI for blind transfer (distinct from outbound INVITE).
 * - Inputs: transfer target number and registered SIP account.
 * - Outputs: Refer-To string and kind for adapter logging.
 */
export function buildBlindReferTarget(
  phoneNumber: PhoneNumber,
  account: SipAccount,
): Readonly<{ target: string; kind: ReferTargetKind }> {
  const normalized = phoneNumber.trim();

  if (normalized.toLowerCase().startsWith("sip:")) {
    return { target: normalized, kind: "on_net" };
  }

  const kind = classifyReferTargetKind(phoneNumber);

  if (kind === "on_net") {
    return {
      target: `sip:${normalized}@${account.domain}`,
      kind: "on_net",
    };
  }

  return {
    target: `sip:${normalized}@${account.domain}`,
    kind: "off_net",
  };
}
