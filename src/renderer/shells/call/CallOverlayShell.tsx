import type { JSX } from "react";
import { CampaignEventModal } from "../../components/call/CampaignEventModal.js";
import type { CallFeatureShellBindings } from "../../hooks/useCallFeatureShell.js";

type CallOverlayShellProps = Readonly<{
  bindings: CallFeatureShellBindings;
}>;

/**
 * - Purpose: render call modals in the overlay layer (campaign).
 * - Inputs: call feature shell bindings from useCallFeatureShell.
 * - Outputs: modal overlays; incoming call is rendered in header zone.
 */
export function CallOverlayShell({ bindings }: CallOverlayShellProps): JSX.Element {
  const { campaignActions } = bindings;

  return (
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
  );
}
