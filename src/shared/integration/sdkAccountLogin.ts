/**
 * Login matching for SDK account activate (ADR-0013/0018 login path).
 * Preserve case; trim spaces; treat `1001` and `1001@domain` as matching local-parts.
 */

export function trimSdkAccountLogin(login: string): string {
  return login.trim();
}

export function sdkAccountLoginLocalPart(login: string): string {
  const trimmed = trimSdkAccountLogin(login);
  const at = trimmed.indexOf("@");
  return at === -1 ? trimmed : trimmed.slice(0, at);
}

/**
 * Case-sensitive match after trim. Equal full strings OR equal non-empty local-parts.
 */
export function sdkAccountLoginsMatch(
  requestedLogin: string,
  storedLogin: string,
): boolean {
  const requested = trimSdkAccountLogin(requestedLogin);
  const stored = trimSdkAccountLogin(storedLogin);
  if (requested.length === 0 || stored.length === 0) {
    return false;
  }
  if (requested === stored) {
    return true;
  }
  const requestedLocal = sdkAccountLoginLocalPart(requested);
  const storedLocal = sdkAccountLoginLocalPart(stored);
  return (
    requestedLocal.length > 0 &&
    storedLocal.length > 0 &&
    requestedLocal === storedLocal
  );
}
