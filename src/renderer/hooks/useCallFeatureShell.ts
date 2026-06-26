import { useMemo } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveActiveCallControlsShell,
  deriveResumeMultiCallDisabledReason,
} from "@application/index.js";
import { mapActiveCallControlDisabledReason } from "../helpers/mapActiveCallControlLabels.js";
import { useTransferActions, useTransferPanelShell } from "./useTransferActions.js";
import { useCallLinesActions } from "./useCallLinesActions.js";
import { useCallLineRowShell } from "./useCallLineRowShell.js";
import { useIncomingCallShell } from "./useIncomingCallShell.js";
import { useCampaignActions } from "./useCampaignActions.js";
import { useDialpadShell } from "./useDialpadShell.js";
import { useSoftphoneCallActions } from "./useSoftphoneCallActions.js";
import { useIncomingCallActions } from "./useIncomingCallActions.js";
import { useSoftphoneProjections } from "./useSoftphoneProjections.js";

type UseCallFeatureShellInput = Readonly<{
  facade: AccountBootstrapFacade;
}>;

/**
 * - Purpose: bind call feature projections, shell derivations, and action handlers.
 * - Inputs: account bootstrap facade.
 * - Outputs: zone-ready props for context, controls, and overlay shells.
 */
export function useCallFeatureShell({ facade }: UseCallFeatureShellInput) {
  const {
    projection,
    callProjection,
    activeCallControlsProjection,
    incomingCallProjection,
    queueInfoProjection,
    campaignProjection,
    multiCallProjection,
    transferProjection,
    multiLineCallProjection,
    operatorStatusProjection,
    setCallMode,
    setIncomingUiState,
    setIncomingBreakReason,
    setIncomingRejectReasonRequired,
  } = useSoftphoneProjections();

  const {
    dialedNumber,
    setDialedNumber,
    deleteLastDialedDigit,
    clearDialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
  } = useDialpadShell(projection, callProjection, multiCallProjection);

  const callActions = useSoftphoneCallActions({
    facade,
    callProjection,
    activeCallControlsProjection,
    dialedNumber,
    callDisabledReason,
  });

  const incomingCallActions = useIncomingCallActions({
    facade,
    incomingCallProjection,
    multiCallProjection,
    isOcpMode: projection.isOcpMode,
    setIncomingUiState,
    setIncomingRejectReasonRequired,
  });

  const incomingCallShell = useIncomingCallShell({
    isOcpMode: projection.isOcpMode,
    incomingCallProjection,
    queueInfoProjection,
  });

  const campaignActions = useCampaignActions({
    facade,
    isOcpMode: projection.isOcpMode,
    incomingCallProjection,
    campaignProjection,
  });

  const transferPanelShell = useTransferPanelShell({
    transferProjection,
    multiLineCallProjection,
    multiCallProjection,
    activeCallControlsProjection,
  });

  const transferActions = useTransferActions({
    facade,
    sourceCallId: transferPanelShell.sourceCallId,
    consultationCallId: transferPanelShell.consultationCallId,
    targetNumber: transferPanelShell.targetNumber,
    blindTransferDisabledReason: transferPanelShell.blindTransferDisabledReason,
    startConsultationDisabledReason: transferPanelShell.startConsultationDisabledReason,
    attendedTransferDisabledReason: transferPanelShell.attendedTransferDisabledReason,
    cancelTransferDisabledReason: transferPanelShell.cancelTransferDisabledReason,
    activeCallControlsProjection,
  });

  const activeCallControlsShell = useMemo(
    () => deriveActiveCallControlsShell(activeCallControlsProjection, transferProjection),
    [activeCallControlsProjection, transferProjection],
  );

  const callLinesShell = useCallLineRowShell({
    multiLineCallProjection,
    multiCallProjection,
    queueInfoProjection,
    activeCallControlsProjection,
    transferProjection,
    isOcpMode: projection.isOcpMode,
  });
  const callLinesActions = useCallLinesActions({ facade, shell: callLinesShell });

  const handleTransferLine = (callId: string): void => {
    const line = callLinesShell.lines.find((entry) => entry.callId === callId);
    if (line?.isActiveUnheld !== true) {
      return;
    }
    transferActions.handleStartTransfer();
  };

  const combinedResumeDisabledReason = useMemo(() => {
    const multiCallReason = deriveResumeMultiCallDisabledReason(multiCallProjection);
    if (multiCallReason !== null) {
      return multiCallReason;
    }
    const controlReason = activeCallControlsProjection.resumeDisabledReason;
    return controlReason === null
      ? null
      : mapActiveCallControlDisabledReason(controlReason);
  }, [activeCallControlsProjection.resumeDisabledReason, multiCallProjection]);

  const incomingRejectReasons = projection.isOcpMode
    ? operatorStatusProjection.allowedBreakReasons
    : [];

  return {
    projection,
    callProjection,
    activeCallControlsProjection,
    incomingCallProjection,
    multiCallProjection,
    multiLineCallProjection,
    dialedNumber,
    setDialedNumber,
    deleteLastDialedDigit,
    clearDialedNumber,
    dialpadMode,
    isCalling,
    callDisabledReason,
    callActions,
    incomingCallActions,
    incomingCallShell,
    campaignActions,
    transferPanelShell,
    transferActions,
    activeCallControlsShell,
    callLinesShell,
    callLinesActions,
    handleTransferLine,
    combinedResumeDisabledReason,
    incomingRejectReasons,
    setCallMode,
    setIncomingBreakReason,
  };
}

export type CallFeatureShellBindings = ReturnType<typeof useCallFeatureShell>;
