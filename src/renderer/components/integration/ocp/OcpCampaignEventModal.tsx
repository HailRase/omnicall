import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button } from "../../ui/button/Button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog/index.js";
import styles from "./OcpCampaignEventModal.module.css";

export type OcpCampaignEventModalView = Readonly<{
  campaignEventId: string;
  companyTitle: string;
  queueTitle: string;
  selectionTitle: string;
  strategyTitle: string;
  clientPhone: string;
}>;

export type OcpCampaignEventModalProps = Readonly<{
  open: boolean;
  campaign: OcpCampaignEventModalView | null;
  submitting: boolean;
  pendingAction: "accept" | "reject" | null;
  onAccept: () => void;
  onReject: () => void;
}>;

/**
 * - Purpose: mandatory accept/reject dialog for an active OCP campaign invite.
 * - Inputs: open flag, campaign display fields, submitting state, callbacks.
 * - Outputs: presentational Dialog that cannot dismiss via Escape or outside click.
 * @uiMeta f=F-028 lf=LF-047
 */
export function OcpCampaignEventModal({
  open,
  campaign,
  submitting,
  pendingAction,
  onAccept,
  onReject,
}: OcpCampaignEventModalProps): JSX.Element {
  const { t } = useI18n();
  const actionsDisabled = !open || campaign === null || submitting;

  return (
    <Dialog open={open}>
      <DialogContent
        className={styles.content}
        data-testid="ocp-campaign-modal"
        showCloseButton={false}
        closeLabel={t("common.close")}
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("ocp.campaign.modal.title")}</DialogTitle>
          <DialogDescription>{t("ocp.campaign.modal.description")}</DialogDescription>
        </DialogHeader>

        {campaign !== null ? (
          <dl className={styles.details} data-testid="ocp-campaign-details">
            <div className={styles.row}>
              <dt className={styles.term}>{t("ocp.campaign.modal.company")}</dt>
              <dd className={styles.value}>{campaign.companyTitle}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.term}>{t("ocp.campaign.modal.queue")}</dt>
              <dd className={styles.value}>{campaign.queueTitle}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.term}>{t("ocp.campaign.modal.selection")}</dt>
              <dd className={styles.value}>{campaign.selectionTitle}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.term}>{t("ocp.campaign.modal.strategy")}</dt>
              <dd className={styles.value}>{campaign.strategyTitle}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.term}>{t("ocp.campaign.modal.phone")}</dt>
              <dd className={styles.value}>{campaign.clientPhone}</dd>
            </div>
          </dl>
        ) : null}

        <DialogFooter className={styles.footer}>
          <Button
            type="button"
            variant="ghost"
            data-testid="ocp-campaign-reject"
            aria-label={t("ocp.campaign.modal.rejectAria")}
            disabled={actionsDisabled}
            loading={submitting && pendingAction === "reject"}
            onClick={onReject}
          >
            {t("ocp.campaign.modal.reject")}
          </Button>
          <Button
            type="button"
            variant="primary"
            data-testid="ocp-campaign-accept"
            aria-label={t("ocp.campaign.modal.acceptAria")}
            disabled={actionsDisabled}
            loading={submitting && pendingAction === "accept"}
            onClick={onAccept}
          >
            {t("ocp.campaign.modal.accept")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
