import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  ActiveCallControlsProjection,
  CallProjection,
} from "@application/index.js";

type UseSoftphoneCallActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  callProjection: CallProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  dialedNumber: string;
  callDisabledReason: string | null;
}>;

type UseSoftphoneCallActionsResult = Readonly<{
  handleDialpadCall: () => void;
  handleSendDtmf: (tone: string) => void;
  handleHoldCall: () => void;
  handleResumeCall: () => void;
  handleMuteCall: () => void;
  handleUnmuteCall: () => void;
  handleHangupCall: () => void;
  handleRetryLastOperation: () => void;
}>;

/**
 * - Purpose: bind softphone call UI intents to AccountBootstrapFacade methods.
 * - Inputs: facade, call projections, dialed number, disabled reason.
 * - Outputs: callback handlers for dialpad and active call controls.
 */
export function useSoftphoneCallActions(
  input: UseSoftphoneCallActionsInput,
): UseSoftphoneCallActionsResult {
  const {
    facade,
    callProjection,
    activeCallControlsProjection,
    dialedNumber,
    callDisabledReason,
  } = input;

  const handleDialpadCall = (): void => {
    if (facade === null || callDisabledReason !== null) {
      return;
    }
    void facade.makeCall(dialedNumber);
  };

  const handleSendDtmf = (tone: string): void => {
    if (facade === null || callProjection.activeCallId === null) {
      return;
    }
    void facade.sendDtmfByCallId(callProjection.activeCallId, tone);
  };

  const handleHoldCall = (): void => {
    if (
      facade === null ||
      activeCallControlsProjection.callId === null ||
      activeCallControlsProjection.holdDisabledReason !== null
    ) {
      return;
    }
    void facade.holdCallById(activeCallControlsProjection.callId);
  };

  const handleResumeCall = (): void => {
    if (
      facade === null ||
      activeCallControlsProjection.callId === null ||
      activeCallControlsProjection.resumeDisabledReason !== null
    ) {
      return;
    }
    void facade.resumeCallById(activeCallControlsProjection.callId);
  };

  const handleMuteCall = (): void => {
    if (
      facade === null ||
      activeCallControlsProjection.callId === null ||
      activeCallControlsProjection.muteDisabledReason !== null
    ) {
      return;
    }
    void facade.muteCallById(activeCallControlsProjection.callId);
  };

  const handleUnmuteCall = (): void => {
    if (
      facade === null ||
      activeCallControlsProjection.callId === null ||
      activeCallControlsProjection.unmuteDisabledReason !== null
    ) {
      return;
    }
    void facade.unmuteCallById(activeCallControlsProjection.callId);
  };

  const handleHangupCall = (): void => {
    if (
      facade === null ||
      activeCallControlsProjection.callId === null ||
      activeCallControlsProjection.hangupDisabledReason !== null
    ) {
      return;
    }
    void facade.hangupCallById(activeCallControlsProjection.callId);
  };

  const handleRetryLastOperation = (): void => {
    const lastError = activeCallControlsProjection.lastOperationError;
    if (lastError === null) {
      return;
    }

    switch (lastError.operation) {
      case "hold":
        handleHoldCall();
        break;
      case "resume":
        handleResumeCall();
        break;
      case "mute":
        handleMuteCall();
        break;
      case "unmute":
        handleUnmuteCall();
        break;
      case "hangup":
        handleHangupCall();
        break;
    }
  };

  return {
    handleDialpadCall,
    handleSendDtmf,
    handleHoldCall,
    handleResumeCall,
    handleMuteCall,
    handleUnmuteCall,
    handleHangupCall,
    handleRetryLastOperation,
  };
}
