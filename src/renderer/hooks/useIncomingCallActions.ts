import { useEffect } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { IncomingCallProjection } from "@application/index.js";

type UseIncomingCallActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  incomingCallProjection: IncomingCallProjection;
  isOcpMode: boolean;
  setIncomingUiState: (state: IncomingCallProjection["uiState"]) => void;
  setIncomingRejectReasonRequired: (required: boolean) => void;
}>;

type UseIncomingCallActionsResult = Readonly<{
  handleAnswerIncoming: () => void;
  handleRejectIncoming: () => void;
  answerDisabledReason: string | null;
  rejectDisabledReason: string | null;
}>;

/**
 * - Purpose: bind incoming call UI intents to facade and derive disabled reasons.
 * - Inputs: facade, incoming projection, OCP mode flag, store setters.
 * - Outputs: answer/reject handlers and transient UI disabled reasons.
 */
export function useIncomingCallActions(
  input: UseIncomingCallActionsInput,
): UseIncomingCallActionsResult {
  const {
    facade,
    incomingCallProjection,
    isOcpMode,
    setIncomingUiState,
    setIncomingRejectReasonRequired,
  } = input;

  useEffect(() => {
    setIncomingRejectReasonRequired(isOcpMode);
  }, [isOcpMode, setIncomingRejectReasonRequired]);

  const handleAnswerIncoming = (): void => {
    if (facade === null || incomingCallProjection.callId === null) {
      return;
    }
    setIncomingUiState("answering");
    void facade.answerCallById(incomingCallProjection.callId);
  };

  const handleRejectIncoming = (): void => {
    if (facade === null || incomingCallProjection.callId === null) {
      return;
    }
    setIncomingUiState("rejecting");
    void facade.rejectCallById(
      incomingCallProjection.callId,
      incomingCallProjection.selectedBreakReason ?? undefined,
    );
  };

  const answerDisabledReason =
    incomingCallProjection.uiState === "rejecting" ? "Reject in progress" : null;
  const rejectDisabledReason =
    incomingCallProjection.uiState === "answering" ? "Answer in progress" : null;

  return {
    handleAnswerIncoming,
    handleRejectIncoming,
    answerDisabledReason,
    rejectDisabledReason,
  };
}
