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

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * - Purpose: mandatory accept/reject dialog for non-progressive OCP campaign preview.
 * - Inputs: open flag, campaign display fields, submitting state, callbacks.
 * - Outputs: centered Dialog with blur scrim; Escape/outside dismiss blocked.
 * @uiMeta f=F-028 lf=LF-039,LF-040
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

  const metaParts =
    campaign === null
      ? []
      : [
          hasText(campaign.companyTitle) ? campaign.companyTitle.trim() : null,
          hasText(campaign.queueTitle) ? campaign.queueTitle.trim() : null,
          hasText(campaign.selectionTitle) ? campaign.selectionTitle.trim() : null,
        ].filter((part): part is string => part !== null);

  return (
    <Dialog open={open}>
      <DialogContent
        size="sm"
        className={styles.content}
        overlayClassName={styles.overlayBlur}
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
        <DialogHeader className={styles.header}>
          <DialogTitle>{t("ocp.campaign.modal.title")}</DialogTitle>
          <DialogDescription className={styles.description}>
            {t("ocp.campaign.modal.description")}
          </DialogDescription>
        </DialogHeader>

        {campaign !== null ? (
          <div className={styles.body} data-testid="ocp-campaign-details">
            <p className={styles.phoneLabel}>{t("ocp.campaign.modal.phone")}</p>
            <p className={styles.phone} data-testid="ocp-campaign-phone">
              {campaign.clientPhone}
            </p>
            {metaParts.length > 0 ? (
              <p className={styles.meta} data-testid="ocp-campaign-meta">
                {metaParts.join(" · ")}
              </p>
            ) : null}
            {hasText(campaign.strategyTitle) ? (
              <p className={styles.strategy} data-testid="ocp-campaign-strategy">
                {campaign.strategyTitle.trim()}
              </p>
            ) : null}
          </div>
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
