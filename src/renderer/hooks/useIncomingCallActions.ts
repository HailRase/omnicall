import { useEffect } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveIncomingAnswerDisabledReason,
  type IncomingCallProjection,
  type MultiCallProjection,
} from "@application/index.js";

type UseIncomingCallActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  incomingCallProjection: IncomingCallProjection;
  multiCallProjection: MultiCallProjection;
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
    multiCallProjection,
    isOcpMode,
    setIncomingUiState,
    setIncomingRejectReasonRequired,
  } = input;

  useEffect(() => {
    setIncomingRejectReasonRequired(isOcpMode);
  }, [isOcpMode, setIncomingRejectReasonRequired]);

  const policyAnswerDisabled = deriveIncomingAnswerDisabledReason(multiCallProjection);

  const handleAnswerIncoming = (): void => {
    if (
      facade === null ||
      incomingCallProjection.callId === null ||
      policyAnswerDisabled !== null
    ) {
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
    incomingCallProjection.uiState === "rejecting"
      ? "Отклонение выполняется"
      : policyAnswerDisabled;
  const rejectDisabledReason =
    incomingCallProjection.uiState === "answering" ? "Ответ выполняется" : null;

  return {
    handleAnswerIncoming,
    handleRejectIncoming,
    answerDisabledReason,
    rejectDisabledReason,
  };
}
