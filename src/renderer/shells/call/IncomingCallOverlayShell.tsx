import type { JSX } from "react";
import { IncomingCallOverlay } from "../../components/call/IncomingCallOverlay.js";
import { useAutoAnswerCountdown } from "../../hooks/useAutoAnswerCountdown.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";
import { useIncomingCallOverlayActions } from "../../hooks/useIncomingCallOverlayActions.js";
import { useIncomingCallOverlayShell } from "../../hooks/useIncomingCallOverlayShell.js";
import type { UseOverlayShellResult } from "../../hooks/useOverlayShell.js";
import { useShellNavigation } from "../../navigation/index.js";
import { useSoftphoneProjections } from "../../hooks/useSoftphoneProjections.js";

type IncomingCallOverlayShellProps = Readonly<{
  callBindings: CallFeatureShellBindings;
  overlayShell: UseOverlayShellResult;
}>;

/**
 * - Purpose: mount global incoming call overlay in the shell overlay layer.
 * - Inputs: call feature bindings and settings overlay shell state.
 * - Outputs: wired IncomingCallOverlay with navigation orchestration.
 */
export function IncomingCallOverlayShell({
  callBindings,
  overlayShell,
}: IncomingCallOverlayShellProps): JSX.Element {
  const { route, goToDialpad } = useShellNavigation();
  const { transferProjection } = useSoftphoneProjections();
  const overlayVm = useIncomingCallOverlayShell({
    incomingCallProjection: callBindings.incomingCallProjection,
    shellRouteName: route.name,
    incomingSessionCardVisible: callBindings.incomingSessionCardVisible,
  });
  const overlayActions = useIncomingCallOverlayActions({
    incomingCallProjection: callBindings.incomingCallProjection,
    incomingCallActions: callBindings.incomingCallActions,
    transferProjection,
    transferPanelShell: callBindings.transferPanelShell,
    transferActions: callBindings.transferActions,
    settingsOpen: overlayShell.settingsOpen,
    closeSettings: overlayShell.closeOverlay,
    goToDialpad,
    setCallMode: callBindings.setCallMode,
    closeNumberEntryOverlay: callBindings.closeNumberEntryOverlay,
    selectIncomingCall: callBindings.selectIncomingCall,
  });
  const autoAnswerSecondsRemaining = useAutoAnswerCountdown(
    callBindings.incomingCallProjection.autoAnswerExpiresAt,
    callBindings.incomingCallProjection.uiState === "autoAnswerCountdown",
  );

  return (
    <IncomingCallOverlay
      visible={overlayVm.visible}
      callerNumber={callBindings.incomingCallShell.identity.callerNumber}
      displayName={callBindings.incomingCallShell.identity.displayName}
      autoAnswerSecondsRemaining={autoAnswerSecondsRemaining}
      uiState={callBindings.incomingCallProjection.uiState}
      answerDisabledReason={callBindings.incomingCallActions.answerDisabledReason}
      videoAnswerDisabledReason={
        callBindings.incomingCallActions.videoAnswerDisabledReason
      }
      rejectDisabledReason={callBindings.incomingCallActions.rejectDisabledReason}
      onOpenCallSurface={overlayActions.handleOpenCallSurface}
      onAnswer={overlayActions.handleAnswer}
      onAnswerWithVideo={overlayActions.handleAnswerWithVideo}
      onReject={overlayActions.handleReject}
      onDismiss={overlayVm.handleDismiss}
    />
  );
}
