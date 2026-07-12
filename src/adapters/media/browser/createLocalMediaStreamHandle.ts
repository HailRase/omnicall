/**
 * - Purpose: create branded opaque local media stream handles.
 * - Inputs: optional raw id string.
 * - Outputs: LocalMediaStreamHandle for adapter-owned streams.
 */

import type { LocalMediaStreamHandle } from "@ports/media/LocalMediaCapturePort.js";

let handleCounter = 0;

export function createLocalMediaStreamHandle(
  raw?: string,
): LocalMediaStreamHandle {
  const id = raw ?? `local-media-${++handleCounter}`;
  return id as LocalMediaStreamHandle;
}

export function resetLocalMediaStreamHandleCounterForTests(): void {
  handleCounter = 0;
}
