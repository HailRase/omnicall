import { mapSipRegistrationFailureKey } from "./mapSipRegistrationFailureKey.js";

export const NON_RETRYABLE_SIP_AUTH_HTTP_CODES = [401, 403] as const;

const NON_RETRYABLE_SIP_REGISTRATION_FAILURE_KEYS = new Set([
  "authentication_error",
  "forbidden",
]);

/**
 * - Purpose: detect non-retryable SIP auth HTTP response codes (ADR-0004 §1.7).
 * - Inputs: numeric SIP/HTTP response code.
 * - Outputs: true for 401 and 403.
 */
export function isNonRetryableSipAuthHttpCode(code: number): boolean {
  return (NON_RETRYABLE_SIP_AUTH_HTTP_CODES as ReadonlyArray<number>).includes(code);
}

/**
 * - Purpose: detect non-retryable registration failure reason keys.
 * - Inputs: normalized reason key from mapSipRegistrationFailureKey.
 * - Outputs: true for authentication_error and forbidden.
 */
export function isNonRetryableSipRegistrationFailureKey(reasonKey: string): boolean {
  return NON_RETRYABLE_SIP_REGISTRATION_FAILURE_KEYS.has(reasonKey);
}

/**
 * - Purpose: classify auth failures that must stop auto-retry immediately.
 * - Inputs: HTTP code and/or raw failure text.
 * - Outputs: true when retry must not continue.
 */
export function isNonRetryableSipAuthError(
  code: number | null,
  rawFailureText?: string,
): boolean {
  if (code !== null && isNonRetryableSipAuthHttpCode(code)) {
    return true;
  }

  if (rawFailureText !== undefined && rawFailureText.length > 0) {
    const reasonKey = mapSipRegistrationFailureKey(rawFailureText);
    return isNonRetryableSipRegistrationFailureKey(reasonKey);
  }

  return false;
}

/**
 * - Purpose: Russian terminal auth message for header/settings (ADR-0004 §1.7).
 * - Inputs: optional HTTP code and failure text.
 * - Outputs: user-visible terminal recovery message.
 */
export function formatSipAuthTerminalMessage(
  code: number | null,
  rawFailureText: string,
): string {
  const reasonKey = mapSipRegistrationFailureKey(rawFailureText);
  const label = reasonKey === "forbidden" ? "Forbidden" : "Authentication Error";
  const codeSuffix = code !== null ? `${code} ` : "";
  return `Переподключение прервано. Ошибка: ${codeSuffix}${label}. Проверьте логин/пароль`;
}
