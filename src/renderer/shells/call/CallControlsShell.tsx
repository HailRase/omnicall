import type { JSX } from "react";
import { CallControlsBar } from "../../components/call/CallControlsBar.js";
import { Dialpad } from "../../components/dialpad/Dialpad.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";
import { mapAvatarMenuShellNavigationDisabledReason } from "../../helpers/mapAvatarMenuShellNavigationDisabledReason.js";
import { useAuthShellFlags } from "../../hooks/useAuthShellFlags.js";
import { useSoftphoneProjections } from "../../hooks/useSoftphoneProjections.js";
import { useShellNavigation } from "../../navigation/index.js";
import { useI18n } from "../../i18n/index.js";
import styles from "./CallControlsShell.module.css";

type CallControlsShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render bottom controls zone for active controls and dialpad.
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: controls zone markup hidden for transfer and DTMF modes.
 */
export function CallControlsShell({ bindings }: CallControlsShellProps): JSX.Element {
  const { t } = useI18n();
  const { navigateTo } = useShellNavigation();
  const { isSipRegistered } = useAuthShellFlags();
  const { projection } = useSoftphoneProjections();
  const contactsDisabledReason = mapAvatarMenuShellNavigationDisabledReason({
    isSipRegistered,
    authUiState: projection.authUiState,
  });
  const {
    callProjection,
    dialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    inputDisabledReason,
    callActions,
    callLinesActions,
    incomingCallActions,
    isIncomingSelected,
    handleTransferLine,
    setCallMode,
    setDialedNumber,
    deleteLastDialedDigit,
    clearDialedNumber,
    hasEstablishedCall,
    hasCallInProgress,
    controlTargetLine,
    numberEntryOverlayOpen,
    openNumberEntryOverlay,
    closeNumberEntryOverlay,
    handleDialpadCall,
    walkHistoryNewer,
    walkHistoryOlder,
    canRecallLastNumber,
  } = bindings;

  const hideCallControls =
    dialpadMode === "dtmf" ||
    bindings.transferPanelShell.visible ||
    bindings.transferSuccessCelebration.visible ||
    numberEntryOverlayOpen;

  const handleHangup = (callId: string): void => {
    if (isIncomingSelected) {
      incomingCallActions.handleRejectIncoming();
      return;
    }
    callLinesActions.handleHangupLine(callId);
  };

  const showDialpad =
    (numberEntryOverlayOpen || !hasCallInProgress) && !bindings.transferSuccessCelebration.visible;

  return (
    <div className={styles.zone} data-testid="call-controls-zone">
      {!hideCallControls ? (
        <CallControlsBar
          line={controlTargetLine}
          registrationDisabledReason={inputDisabledReason}
          onHold={callLinesActions.handleHoldLine}
          onResume={callLinesActions.handleResumeLine}
          onMute={callLinesActions.handleMuteLine}
          onUnmute={callLinesActions.handleUnmuteLine}
          onHangup={handleHangup}
          onTransfer={handleTransferLine}
          onShowDtmf={() => {
            setCallMode("dtmf", controlTargetLine?.callId ?? null);
          }}
          onShowNumberEntry={openNumberEntryOverlay}
        />
      ) : null}

      {showDialpad ? (
        <Dialpad
          numberValue={dialedNumber}
          mode={dialpadMode}
          isCalling={isCalling}
          callDisabledReason={callDisabledReason}
          inputDisabledReason={inputDisabledReason}
          canRecallLastNumber={canRecallLastNumber}
          hasEstablishedCall={hasEstablishedCall}
          overlayMode={numberEntryOverlayOpen}
          onNumberChange={setDialedNumber}
          onDelete={deleteLastDialedDigit}
          onClear={clearDialedNumber}
          onCall={handleDialpadCall}
          onHistoryNewer={walkHistoryNewer}
          onHistoryOlder={walkHistoryOlder}
          onOpenContacts={() => {
            navigateTo({ name: "contacts" });
          }}
          contactsDisabledReason={contactsDisabledReason}
          onSendDtmf={callActions.handleSendDtmf}
          onModeChange={setCallMode}
          {...(numberEntryOverlayOpen
            ? { onClose: closeNumberEntryOverlay }
            : {})}
        />
      ) : null}

      <audio
        data-testid="remote-audio-mount"
        aria-label={t("call.remoteAudio.ariaLabel")}
        hidden={!callProjection.remoteAudioAttached}
      />
    </div>
  );
}
