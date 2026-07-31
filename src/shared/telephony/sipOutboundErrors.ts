/**
 * Stable outbound SIP preflight errors (Application + adapters).
 * Localized UI strings never travel on the wire.
 */

export const SIP_NOT_REGISTERED_OUTBOUND_MESSAGE =
  "SIP not registered for outbound call" as const;

export const SIP_NOT_REGISTERED_REASON = "sip_not_registered" as const;

export type SipNotRegisteredCause = Readonly<{
  reason: typeof SIP_NOT_REGISTERED_REASON;
}>;

export function createSipNotRegisteredCause(): SipNotRegisteredCause {
  return { reason: SIP_NOT_REGISTERED_REASON };
}

export function isSipNotRegisteredError(error: Readonly<{
  message: string;
  cause?: unknown;
}>): boolean {
  if (error.message === SIP_NOT_REGISTERED_OUTBOUND_MESSAGE) {
    return true;
  }
  if (typeof error.cause !== "object" || error.cause === null) {
    return false;
  }
  return (
    (error.cause as Record<string, unknown>)["reason"] === SIP_NOT_REGISTERED_REASON
  );
}
