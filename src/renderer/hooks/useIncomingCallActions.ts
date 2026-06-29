import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveIncomingAnswerDisabledReason,
  type IncomingCallProjection,
  type MultiCallProjection,
} from "@application/index.js";
import { mapDialpadDisabledReason } from "../helpers/mapDialpadDisabledReason.js";

type UseIncomingCallActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  incomingCallProjection: IncomingCallProjection;
  multiCallProjection: MultiCallProjection;
  isSipRegistered: boolean;
  setIncomingUiState: (state: IncomingCallProjection["uiState"]) => void;
}>;

type UseIncomingCallActionsResult = Readonly<{
  handleAnswerIncoming: () => void;
  handleRejectIncoming: () => void;
  answerDisabledReason: string | null;
  rejectDisabledReason: string | null;
}>;

/**
 * - Purpose: bind incoming call UI intents to facade and derive disabled reasons.
 * - Inputs: facade, incoming projection, registration flag, store setters.
 * - Outputs: answer/reject handlers and transient UI disabled reasons.
 */
export function useIncomingCallActions(
  input: UseIncomingCallActionsInput,
): UseIncomingCallActionsResult {
  const {
    facade,
    incomingCallProjection,
    multiCallProjection,
    isSipRegistered,
    setIncomingUiState,
  } = input;

  const policyAnswerDisabled = deriveIncomingAnswerDisabledReason(multiCallProjection);
  const registrationAnswerDisabled = isSipRegistered
    ? null
    : mapDialpadDisabledReason("disabledByNotRegistered");

  const handleAnswerIncoming = (): void => {
    if (
      facade === null ||
      incomingCallProjection.callId === null ||
      registrationAnswerDisabled !== null ||
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
    void facade.rejectCallById(incomingCallProjection.callId);
  };

  const answerDisabledReason =
    incomingCallProjection.uiState === "rejecting"
      ? "Отклонение выполняется"
      : (registrationAnswerDisabled ?? policyAnswerDisabled);
  const rejectDisabledReason =
    incomingCallProjection.uiState === "answering" ? "Ответ выполняется" : null;

  return {
    handleAnswerIncoming,
    handleRejectIncoming,
    answerDisabledReason,
    rejectDisabledReason,
  };
}
