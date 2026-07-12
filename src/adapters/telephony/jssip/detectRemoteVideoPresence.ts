/**
 * - Purpose: detect whether remote SDP accepted an active video media section.
 * - Inputs: remote SDP offer or answer text.
 * - Outputs: true only when remote can send video to local peer.
 */
export function detectRemoteVideoPresence(sdp: string): boolean {
  const lines = sdp.split(/\r?\n/u).map((line) => line.trim());
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined || !line.startsWith("m=video ")) {
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

    if (Number(firstPortToken) <= 0) {
      continue;
    }

    const direction = resolveVideoDirection(lines, index + 1);
    if (direction === "inactive" || direction === "recvonly") {
      continue;
    }

    return true;
  }

  return false;
}

type SdpDirection = "sendrecv" | "sendonly" | "recvonly" | "inactive";

function resolveVideoDirection(lines: ReadonlyArray<string>, startIndex: number): SdpDirection {
  let direction: SdpDirection = "sendrecv";
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined || line.length === 0) {
      continue;
    }
    if (line.startsWith("m=")) {
      break;
    }
    if (line === "a=sendrecv") {
      direction = "sendrecv";
    } else if (line === "a=sendonly") {
      direction = "sendonly";
    } else if (line === "a=recvonly") {
      direction = "recvonly";
    } else if (line === "a=inactive") {
      direction = "inactive";
    }
  }
  return direction;
}
