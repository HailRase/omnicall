import type { TonePlaybackKind } from "./TonePlaybackKind.js";
import type { TonePlaybackRequest } from "./TonePlaybackRequest.js";

/**
 * - Purpose: pick the single tone stream that should be audible.
 * - Inputs: active tone requests from all call lines.
 * - Outputs: winning request or null when no tone should play.
 */

const TONE_PRIORITY: Readonly<Record<TonePlaybackKind, number>> = {
  ringtone: 4,
  ringback: 3,
  busy: 2,
  failed: 1,
};

function compareToneRequests(
  left: TonePlaybackRequest,
  right: TonePlaybackRequest,
): TonePlaybackRequest {
  const leftPriority = TONE_PRIORITY[left.kind];
  const rightPriority = TONE_PRIORITY[right.kind];

  if (leftPriority > rightPriority) {
    return left;
  }

  if (rightPriority > leftPriority) {
    return right;
  }

  return left.sequence <= right.sequence ? left : right;
}

export function resolveActiveTonePlayback(
  requests: ReadonlyArray<TonePlaybackRequest>,
): TonePlaybackRequest | null {
  if (requests.length === 0) {
    return null;
  }

  const [first, ...rest] = requests;
  if (first === undefined) {
    return null;
  }

  let winner = first;
  for (const candidate of rest) {
    winner = compareToneRequests(winner, candidate);
  }

  return winner;
}
