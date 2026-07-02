import { mapSipRegistrationFailureKey } from "./mapSipRegistrationFailureKey.js";

/**
 * - Purpose: map JsSIP registration failure cause and SIP status to stable reason key.
 * - Inputs: JsSIP cause string and optional SIP response status code.
 * - Outputs: normalized registration failure reason key.
 */
export function mapSipRegistrationFailureFromParts(
  cause: string,
  statusCode: number | null,
): string {
  if (statusCode === 401) {
    return "authentication_error";
  }

  if (statusCode === 403) {
    return "forbidden";
  }

  const raw =
    statusCode !== null
      ? `${statusCode} ${cause}`.trim()
      : cause.trim();

  return mapSipRegistrationFailureKey(raw);
}
