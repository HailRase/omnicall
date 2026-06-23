import { useMemo } from "react";
import type {
  IncomingCallProjection,
  QueueInfoProjection,
} from "@application/index.js";
import {
  deriveQueueLabelState,
  getQueueLoadingSinceForCall,
  getQueueNameForCall,
} from "@application/index.js";
import { mapQueueLabelState } from "../helpers/mapQueueLabelState.js";
import { useQueueLabelNaTimer } from "./useQueueLabelNaTimer.js";

type UseIncomingCallShellInput = Readonly<{
  isOcpMode: boolean;
  incomingCallProjection: IncomingCallProjection;
  queueInfoProjection: QueueInfoProjection;
}>;

type UseIncomingCallShellResult = Readonly<{
  queueLabelState: ReturnType<typeof deriveQueueLabelState>;
  queueLabelDisplay: ReturnType<typeof mapQueueLabelState>;
  queueName: string | null;
}>;

/**
 * - Purpose: compose incoming call queue label presentation from projections (LF-037).
 * - Inputs: OCP mode flag, incoming and queue info projections.
 * - Outputs: queue label state and mapped display props for QueueInfoLabel.
 */
export function useIncomingCallShell(
  input: UseIncomingCallShellInput,
): UseIncomingCallShellResult {
  const { isOcpMode, incomingCallProjection, queueInfoProjection } = input;
  const callId = incomingCallProjection.callId;

  const baseQueueLabelState = useMemo(() => {
    if (!isOcpMode) {
      return "hidden" as const;
    }
    return deriveQueueLabelState(queueInfoProjection, callId);
  }, [isOcpMode, queueInfoProjection, callId]);

  const loadingSinceMs = useMemo(() => {
    if (!isOcpMode) {
      return null;
    }
    return getQueueLoadingSinceForCall(queueInfoProjection, callId);
  }, [isOcpMode, queueInfoProjection, callId]);

  const nowMs = useQueueLabelNaTimer(baseQueueLabelState, callId, loadingSinceMs);

  const queueLabelState = useMemo(() => {
    if (!isOcpMode) {
      return "hidden" as const;
    }
    return deriveQueueLabelState(queueInfoProjection, callId, { nowMs });
  }, [isOcpMode, queueInfoProjection, callId, nowMs]);

  const queueName = useMemo(() => {
    if (queueLabelState !== "ready") {
      return null;
    }
    return getQueueNameForCall(queueInfoProjection, incomingCallProjection.callId);
  }, [queueInfoProjection, incomingCallProjection.callId, queueLabelState]);

  const queueLabelDisplay = useMemo(
    () => mapQueueLabelState(queueLabelState, queueName),
    [queueLabelState, queueName],
  );

  return {
    queueLabelState,
    queueLabelDisplay,
    queueName,
  };
}
