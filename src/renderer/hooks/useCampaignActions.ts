import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  CampaignProjection,
  IncomingCallProjection,
} from "@application/index.js";
import { getCampaignForCall } from "@application/index.js";
import { isErr } from "@shared/result/index.js";
import { translateCurrent } from "../i18n/index.js";

type UseCampaignActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  isOcpMode: boolean;
  incomingCallProjection: IncomingCallProjection;
  campaignProjection: CampaignProjection;
}>;

type UseCampaignActionsResult = Readonly<{
  campaignContextTitle: string | null;
  modalOpen: boolean;
  modalTitle: string;
  progressive: boolean;
  acceptDisabledReason: string | null;
  rejectDisabledReason: string | null;
  responseError: string | null;
  handleAccept: () => void;
  handleReject: () => void;
  handleCloseModal: () => void;
}>;

/**
 * - Purpose: bind campaign modal UI to facade respond use case (LF-038–LF-040).
 * - Inputs: facade, projections, OCP mode flag.
 * - Outputs: campaign context line, modal state, disabled reasons, action handlers.
 */
export function useCampaignActions(
  input: UseCampaignActionsInput,
): UseCampaignActionsResult {
  const { facade, isOcpMode, incomingCallProjection, campaignProjection } = input;
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [commandInProgress, setCommandInProgress] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [dismissedCampaignIds, setDismissedCampaignIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const campaign = useMemo(() => {
    if (!isOcpMode || !campaignProjection.isOcpSyncAvailable) {
      return null;
    }
    return getCampaignForCall(campaignProjection, incomingCallProjection.callId);
  }, [
    isOcpMode,
    campaignProjection,
    incomingCallProjection.callId,
  ]);

  const campaignContextTitle =
    campaign !== null && incomingCallProjection.visible ? campaign.title : null;

  useEffect(() => {
    if (
      campaign === null ||
      campaign.progressive ||
      !incomingCallProjection.visible ||
      dismissedCampaignIds.has(campaign.campaignId)
    ) {
      return;
    }
    setActiveCampaignId(campaign.campaignId);
    setModalOpen(true);
    setResponseError(null);
  }, [
    campaign,
    incomingCallProjection.visible,
    dismissedCampaignIds,
  ]);

  useEffect(() => {
    if (!incomingCallProjection.visible) {
      setModalOpen(false);
      setActiveCampaignId(null);
      setResponseError(null);
      setCommandInProgress(false);
    }
  }, [incomingCallProjection.visible]);

  const ocpUnavailable = !isOcpMode || !campaignProjection.isOcpSyncAvailable;
  const acceptDisabledReason = commandInProgress
    ? "campaign_response_in_progress"
    : ocpUnavailable
      ? "ocp_unavailable"
      : null;
  const rejectDisabledReason = acceptDisabledReason;

  const submitDecision = useCallback(
    (decision: "accept" | "reject"): void => {
      if (
        facade === null ||
        activeCampaignId === null ||
        acceptDisabledReason !== null
      ) {
        return;
      }
      setCommandInProgress(true);
      setResponseError(null);
      void facade
        .respondToCampaignById(
          activeCampaignId,
          decision,
          incomingCallProjection.callId ?? undefined,
        )
        .then((result) => {
          setCommandInProgress(false);
          if (isErr(result)) {
            setResponseError(result.error.message);
            return;
          }
          setDismissedCampaignIds((previous) => {
            const next = new Set(previous);
            next.add(activeCampaignId);
            return next;
          });
          setModalOpen(false);
          setActiveCampaignId(null);
        });
    },
    [
      facade,
      activeCampaignId,
      acceptDisabledReason,
      incomingCallProjection.callId,
    ],
  );

  const handleAccept = useCallback((): void => {
    submitDecision("accept");
  }, [submitDecision]);

  const handleReject = useCallback((): void => {
    submitDecision("reject");
  }, [submitDecision]);

  const handleCloseModal = useCallback((): void => {
    if (commandInProgress || activeCampaignId === null) {
      return;
    }
    setDismissedCampaignIds((previous) => {
      const next = new Set(previous);
      next.add(activeCampaignId);
      return next;
    });
    setModalOpen(false);
    setActiveCampaignId(null);
    setResponseError(null);
  }, [commandInProgress, activeCampaignId]);

  return {
    campaignContextTitle,
    modalOpen: modalOpen && campaign !== null && !campaign.progressive,
    modalTitle: campaign?.title ?? translateCurrent("campaign.modal.ariaLabel"),
    progressive: campaign?.progressive ?? false,
    acceptDisabledReason,
    rejectDisabledReason,
    responseError,
    handleAccept,
    handleReject,
    handleCloseModal,
  };
}
