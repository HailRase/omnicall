import type { JSX } from "react";
import { IncomingCallModal } from "../../components/call/IncomingCallModal.js";
import { CampaignEventModal } from "../../components/call/CampaignEventModal.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";

type CallOverlayShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render call modals in the overlay layer (incoming, campaign).
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: modal overlays; does not replace context zone content.
 */
export function CallOverlayShell({ bindings }: CallOverlayShellProps): JSX.Element | null {
  if (!bindings.sipRegistered) {
    return null;
  }

  const {
    projection,
    incomingCallProjection,
    incomingCallActions,
    incomingCallShell,
    campaignActions,
    incomingRejectReasons,
    setIncomingBreakReason,
  } = bindings;

  return (
    <>
      <IncomingCallModal
        visible={incomingCallProjection.visible}
        callerNumber={incomingCallProjection.callerNumber}
        displayName={incomingCallProjection.displayName}
        queueLabelState={incomingCallShell.queueLabelState}
        queueName={incomingCallShell.queueName}
        campaignContextTitle={campaignActions.campaignContextTitle}
        ringingState={incomingCallProjection.ringingIndicator}
        autoAnswerSecondsRemaining={incomingCallProjection.autoAnswerSecondsRemaining}
        uiState={incomingCallProjection.uiState}
        rejectReasonRequired={projection.isOcpMode}
        rejectReasons={incomingRejectReasons}
        selectedBreakReason={incomingCallProjection.selectedBreakReason}
        answerDisabledReason={incomingCallActions.answerDisabledReason}
        rejectDisabledReason={incomingCallActions.rejectDisabledReason}
        onAnswer={incomingCallActions.handleAnswerIncoming}
        onReject={incomingCallActions.handleRejectIncoming}
        onSelectBreakReason={(reason) => {
          setIncomingBreakReason(reason);
        }}
      />

      <CampaignEventModal
        open={campaignActions.modalOpen}
        title={campaignActions.modalTitle}
        progressive={campaignActions.progressive}
        acceptDisabledReason={campaignActions.acceptDisabledReason}
        rejectDisabledReason={campaignActions.rejectDisabledReason}
        responseError={campaignActions.responseError}
        onAccept={campaignActions.handleAccept}
        onReject={campaignActions.handleReject}
        onClose={campaignActions.handleCloseModal}
      />
    </>
  );
}
