/**
 * - Purpose: normalize JsSIP registration failure text to stable reason keys.
 * - Inputs: raw failure message or JsSIP cause string.
 * - Outputs: stable snake_case key for UI mapping.
 */
export function mapSipRegistrationFailureKey(raw: string): string {
  const normalized = raw.trim().toLowerCase();

  if (normalized === "authentication_error" || normalized === "forbidden") {
    return normalized;
  }

  if (normalized.includes("authentication error") || normalized.includes("401")) {
    return "authentication_error";
  }

  if (normalized.includes("forbidden") || normalized.includes("403")) {
    return "forbidden";
  }

  if (normalized.includes("transport connection timed out") || normalized.includes("transport_connection")) {
    return "transport_connection_timed_out";
  }

  if (normalized.includes("registration_timeout")) {
    return "registration_timeout";
  }

  if (normalized.includes("timeout")) {
    return "registration_timeout";
  }

  if (normalized.includes("connection error")) {
    return "connection_error";
  }

  if (normalized.includes("not found") || normalized.includes("404")) {
    return "not_found";
  }

  if (normalized.includes("unavailable") || normalized.includes("503")) {
    return "service_unavailable";
  }

  return "registration_failed";
}
