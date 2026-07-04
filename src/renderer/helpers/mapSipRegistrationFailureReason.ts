import { translateCurrent } from "../i18n/index.js";

/**
 * - Purpose: map normalized SIP registration failure keys to localized UI copy.
 * - Inputs: stable failure key from domain projection.
 * - Outputs: user-facing localized error message.
 */
export function mapSipRegistrationFailureReason(key: string): string {
  switch (key) {
    case "authentication_error":
      return translateCurrent("sipRegistration.failure.authenticationError");
    case "connection_error":
      return translateCurrent("sipRegistration.failure.connectionError");
    case "transport_connection_timed_out":
      return translateCurrent("sipRegistration.failure.transportConnectionTimedOut");
    case "registration_timeout":
      return translateCurrent("sipRegistration.failure.timeout");
    case "forbidden":
      return translateCurrent("sipRegistration.failure.forbidden");
    case "not_found":
      return translateCurrent("sipRegistration.failure.notFound");
    case "service_unavailable":
      return translateCurrent("sipRegistration.failure.serviceUnavailable");
    case "sip_recovery_exhausted":
      return translateCurrent("sipRegistration.failure.recoveryExhausted");
    default:
      return translateCurrent("sipRegistration.failure.default");
  }
}
