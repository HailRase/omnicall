/**
 * - Purpose: allow only HTTPS external URLs with localhost HTTP exception for tests.
 * - Inputs: URL string candidate.
 * - Outputs: true when protocol and host are permitted.
 */
export function isAllowedHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:") {
      return true;
    }

    if (parsed.protocol === "http:") {
      return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    }

    return false;
  } catch {
    return false;
  }
}
