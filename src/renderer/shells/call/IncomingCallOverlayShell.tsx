import type { JSX } from "react";
import { resolveFullscreenVideoSession } from "@application/index.js";
import { IncomingCallOverlay } from "../../components/call/IncomingCallOverlay.js";
import { useAutoAnswerCountdown } from "../../hooks/useAutoAnswerCountdown.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";
import { useIncomingCallOverlayActions } from "../../hooks/useIncomingCallOverlayActions.js";
import { useIncomingCallOverlayShell } from "../../hooks/useIncomingCallOverlayShell.js";
import type { UseOcpRejectWithBreakResult } from "../../hooks/useOcpRejectWithBreak.js";
import type { UseOverlayShellResult } from "../../hooks/useOverlayShell.js";
import { useShellNavigation } from "../../navigation/index.js";
import { useSoftphoneProjections } from "../../hooks/useSoftphoneProjections.js";

type IncomingCallOverlayShellProps = Readonly<{
  callBindings: CallFeatureShellBindings;
  overlayShell: UseOverlayShellResult;
  ocpRejectWithBreak: UseOcpRejectWithBreakResult;
}>;

/**
 * - Purpose: mount global incoming call overlay in the shell overlay layer.
 * - Inputs: call feature bindings and settings overlay shell state.
 * - Outputs: wired IncomingCallOverlay with navigation orchestration.
 */
export function IncomingCallOverlayShell({
  callBindings,
  overlayShell,
  ocpRejectWithBreak,
}: IncomingCallOverlayShellProps): JSX.Element {
  const { route, goToDialpad } = useShellNavigation();
  const { transferProjection, callVideoMediaUiProjection } = useSoftphoneProjections();
  const videoFullscreen =
    resolveFullscreenVideoSession(callVideoMediaUiProjection.byCallId) !== null;
  const overlayVm = useIncomingCallOverlayShell({
    incomingCallProjection: callBindings.incomingCallProjection,
    shellRouteName: route.name,
    incomingSessionCardVisible: callBindings.incomingSessionCardVisible,
    videoFullscreen,
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
    exitVideoFullscreen: callBindings.exitVideoFullscreen,
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
      rejectChoiceEnabled={ocpRejectWithBreak.rejectChoiceEnabled}
      onOpenCallSurface={overlayActions.handleOpenCallSurface}
      onAnswer={overlayActions.handleAnswer}
      onAnswerWithVideo={
        callBindings.incomingCallActions.canAnswerWithVideo
          ? overlayActions.handleAnswerWithVideo
          : undefined
      }
      onReject={overlayActions.handleReject}
      onRejectWithoutBreak={ocpRejectWithBreak.handleRejectWithoutBreak}
      onRejectWithBreak={ocpRejectWithBreak.handleRequestRejectWithBreak}
      onDismiss={overlayVm.handleDismiss}
    />
  );
}
