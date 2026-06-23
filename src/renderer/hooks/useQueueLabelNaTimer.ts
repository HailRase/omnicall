import { useEffect, useState } from "react";
import type { QueueLabelState } from "@application/index.js";
import { QUEUE_LABEL_NA_TIMEOUT_MS } from "@application/index.js";

/**
 * - Purpose: schedule one-shot NA timeout for queue label loading (LF-037).
 * - Inputs: base label state, callId, loadingSinceMs timestamp.
 * - Outputs: nowMs tick for deriveQueueLabelState without polling.
 */
export function useQueueLabelNaTimer(
  baseLabelState: QueueLabelState,
  callId: string | null,
  loadingSinceMs: number | null,
  naTimeoutMs: number = QUEUE_LABEL_NA_TIMEOUT_MS,
): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setNowMs(Date.now());
    if (baseLabelState !== "loading" || callId === null || loadingSinceMs === null) {
      return;
    }

    const elapsed = Date.now() - loadingSinceMs;
    const remaining = naTimeoutMs - elapsed;
    if (remaining <= 0) {
      setNowMs(Date.now());
      return;
    }

    const timer = setTimeout(() => {
      setNowMs(Date.now());
    }, remaining);

    return () => {
      clearTimeout(timer);
    };
  }, [baseLabelState, callId, loadingSinceMs, naTimeoutMs]);

  return nowMs;
}
