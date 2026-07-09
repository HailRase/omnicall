/**
 * - Purpose: detect whether remote SDP accepted an active video media section.
 * - Inputs: remote SDP offer or answer text.
 * - Outputs: true only for a valid m=video line with a non-zero port.
 */
export function detectRemoteVideoPresence(sdp: string): boolean {
  for (const rawLine of sdp.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line.startsWith("m=video ")) {
      continue;
    }

    const portToken = line.split(/\s+/u)[1];
    if (portToken === undefined) {
      return false;
    }

    const firstPortToken = portToken.split("/")[0];
    if (firstPortToken === undefined || !/^\d+$/u.test(firstPortToken)) {
      return false;
    }

    return Number(firstPortToken) > 0;
  }

  return false;
}
