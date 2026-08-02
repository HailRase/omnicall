/**
 * - Purpose: bind active OCP campaign projection to accept/reject Use Cases.
 * - Inputs: facade + optional notify for errors.
 * - Outputs: modal open state, campaign view model, accept/reject handlers.
 */

import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { CampaignEventProjection } from "@application/index.js";
import { isErr } from "@shared/result/index.js";
import type { OcpCampaignEventModalView } from "../components/integration/ocp/OcpCampaignEventModal.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import type { NotificationDescriptor } from "./useNotifications.js";

type ActiveCampaign = NonNullable<CampaignEventProjection["activeCampaign"]>;

type UseOcpCampaignModalInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

export type UseOcpCampaignModalResult = Readonly<{
  open: boolean;
  campaign: OcpCampaignEventModalView | null;
  submitting: boolean;
  pendingAction: "accept" | "reject" | null;
  handleAccept: () => Promise<void>;
  handleReject: () => Promise<void>;
}>;

function toCampaignView(payload: ActiveCampaign): OcpCampaignEventModalView {
  return {
    campaignEventId: payload.id,
    companyTitle: payload.companyTitle,
    queueTitle: payload.queueTitle,
    selectionTitle: payload.selectionTitle,
    strategyTitle: payload.strategyTitle,
    clientPhone: payload.clientPhone,
  };
}

/**
 * - Purpose: show campaign modal while activeCampaign is set; clear after decision.
 */
export function useOcpCampaignModal(
  input: UseOcpCampaignModalInput,
): UseOcpCampaignModalResult {
  const { facade, notify } = input;
  const activeCampaign = useAccountBootstrapStore(
    (state) => state.ocpCampaignEventProjection.activeCampaign,
  );
  const operatorId = useAccountBootstrapStore(
    (state) => state.ocpOperatorStatusProjection.operatorId,
  );

  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<"accept" | "reject" | null>(
    null,
  );

  const open = activeCampaign !== null;
  const campaign =
    activeCampaign !== null ? toCampaignView(activeCampaign) : null;

  const runDecision = useCallback(
    async (action: "accept" | "reject"): Promise<void> => {
      if (facade === null || submitting || activeCampaign === null) {
        return;
      }
      if (operatorId === null) {
        notify?.({
          level: "error",
          messageKey: "ocp.campaign.modal.error",
          module: "ocp",
          functionId: "ocp.campaign.decision",
          interruptClass: "actionable",
        });
        return;
      }

      setSubmitting(true);
      setPendingAction(action);

      const result =
        action === "accept"
          ? await facade.acceptOcpCampaign({
              operatorId,
              campaignEventId: activeCampaign.id,
            })
          : await facade.rejectOcpCampaign({
              operatorId,
              campaignEventId: activeCampaign.id,
            });

      if (isErr(result)) {
        setSubmitting(false);
        setPendingAction(null);
        notify?.({
          level: "error",
          messageKey: "ocp.campaign.modal.error",
          module: "ocp",
          functionId: "ocp.campaign.decision",
          interruptClass: "actionable",
        });
        return;
      }

      facade.clearOcpActiveCampaign(action === "accept" ? "accepted" : "rejected");
      setSubmitting(false);
      setPendingAction(null);
    },
    [activeCampaign, facade, notify, operatorId, submitting],
  );

  const handleAccept = useCallback(async (): Promise<void> => {
    await runDecision("accept");
  }, [runDecision]);

  const handleReject = useCallback(async (): Promise<void> => {
    await runDecision("reject");
  }, [runDecision]);

  return {
    open,
    campaign,
    submitting,
    pendingAction,
    handleAccept,
    handleReject,
  };
}
