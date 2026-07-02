export type JsSipRegistrationFailureParts = Readonly<{
  cause: string;
  statusCode: number | null;
}>;

/**
 * - Purpose: parse JsSIP registrationFailed event into cause and SIP status code.
 * - Inputs: unknown JsSIP registrationFailed payload.
 * - Outputs: cause string and optional numeric SIP status code.
 */
export function extractJsSipRegistrationFailureParts(
  event: unknown,
): JsSipRegistrationFailureParts {
  if (typeof event !== "object" || event === null) {
    return { cause: "registration_failed", statusCode: null };
  }

  const record = event as Record<string, unknown>;
  const cause =
    typeof record["cause"] === "string" && record["cause"].length > 0
      ? record["cause"]
      : "registration_failed";

  const response = record["response"];
  if (typeof response !== "object" || response === null) {
    return { cause, statusCode: null };
  }

  const statusCode = (response as Record<string, unknown>)["status_code"];
  if (typeof statusCode === "number" && Number.isInteger(statusCode)) {
    return { cause, statusCode };
  }

  return { cause, statusCode: null };
}
