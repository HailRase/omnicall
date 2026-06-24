/**
 * - Purpose: extract SIP response and failure details from JsSIP session events.
 * - Inputs: unknown session event payloads at adapter boundary.
 * - Outputs: normalized status code or failure message strings.
 */
export function extractSipProgressCode(event: unknown): number | null {
  if (typeof event !== "object" || event === null) {
    return null;
  }

  const response = (event as { response?: { status_code?: unknown } }).response;
  if (response === undefined || typeof response.status_code !== "number") {
    return null;
  }

  return response.status_code;
}

export function extractPeerConnection(event: unknown): unknown {
  if (typeof event !== "object" || event === null) {
    return null;
  }

  const connection = (event as { peerconnection?: unknown }).peerconnection;
  return connection ?? null;
}

export function formatSessionFailure(event: unknown): string {
  if (typeof event !== "object" || event === null) {
    return "call_failed";
  }

  const cause = (event as { cause?: unknown }).cause;
  if (typeof cause === "string" && cause.length > 0) {
    return cause;
  }

  return "call_failed";
}
