import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveIncomingAnswerDisabledReason,
  type IncomingCallProjection,
  type MultiCallProjection,
} from "@application/index.js";
import { mapDialpadDisabledReason } from "../helpers/mapDialpadDisabledReason.js";
import { translateCurrent } from "../i18n/index.js";

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
    void facade.answerCallById(incomingCallProjection.callId).then((result) => {
      if (!result.ok) {
        setIncomingUiState("answerFailed");
      }
    });
  };

  const handleRejectIncoming = (): void => {
    if (facade === null || incomingCallProjection.callId === null) {
      return;
    }
    setIncomingUiState("rejecting");
    void facade.rejectCallById(incomingCallProjection.callId).then((result) => {
      if (!result.ok) {
        setIncomingUiState("rejectFailed");
      }
    });
  };

  const answerDisabledReason =
    incomingCallProjection.uiState === "rejecting"
      ? translateCurrent("incoming.status.rejecting")
      : (registrationAnswerDisabled ?? mapPolicyDisabledReason(policyAnswerDisabled));
  const rejectDisabledReason =
    incomingCallProjection.uiState === "answering"
      ? translateCurrent("incoming.status.answering")
      : null;

  return {
    handleAnswerIncoming,
    handleRejectIncoming,
    answerDisabledReason,
    rejectDisabledReason,
  };
}

function mapPolicyDisabledReason(reason: string | null): string | null {
  if (reason === null) {
    return null;
  }
  if (
    reason === "multi.call.disabled.holdAllInProgress" ||
    reason === "multi.call.disabled.connectingInProgress" ||
    reason === "multi.call.disabled.secondSession"
  ) {
    return translateCurrent(reason);
  }
  return reason;
}
