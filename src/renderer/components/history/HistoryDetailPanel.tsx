import type { JSX } from "react";
import { Button } from "../ui/button/Button.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import { PersonListAvatar } from "../list/PersonListAvatar.js";
import type { CallHistoryDetailViewModel } from "../../hooks/useCallHistoryDetailShell.js";
import styles from "./HistoryDetailPanel.module.css";

export type HistoryDetailPanelProps = Readonly<{
  isLoading: boolean;
  isNotFound: boolean;
  entry: CallHistoryDetailViewModel | null;
  onRedial: () => void;
  onDelete: () => void;
}>;

/**
 * - Purpose: render iPhone-like call history detail states inside history sidebar body.
 * - Inputs: loading/not-found/entry snapshot and redial callback.
 * - Outputs: localized hero, action group, and metadata sections.
 * @uiMeta f=F-013 lf=LF-052,LF-053 smoke=history-detail-panel
 */
export function HistoryDetailPanel({
  isLoading,
  isNotFound,
  entry,
  onRedial,
  onDelete,
}: HistoryDetailPanelProps): JSX.Element {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <p className={styles.stateMessage} data-testid="history-detail-loading">
        {t("history.loading")}
      </p>
    );
  }

  if (isNotFound || entry === null) {
    return (
      <p className={styles.stateMessage} data-testid="history-detail-not-found">
        {t("history.detail.notFound")}
      </p>
    );
  }

  return (
    <div className={styles.layout} data-testid="history-detail-panel">
      <div className={styles.hero}>
        <PersonListAvatar label={entry.primaryLabel} size="lg" />
        <h3 className={styles.heroTitle}>{entry.primaryLabel}</h3>
        {entry.secondaryLabel !== null ? (
          <p className={styles.heroSubtitle}>{entry.secondaryLabel}</p>
        ) : (
          <p className={styles.heroSubtitle}>{entry.remoteNumber}</p>
        )}
      </div>

      <div className={styles.actionGroup}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          fullWidth
          className={styles.redialActionButton ?? ""}
          disabled={entry.redialDisabledReason !== null}
          title={entry.redialDisabledReason ?? undefined}
          data-testid="history-detail-redial"
          onClick={onRedial}
        >
          <AppIcon id="dial.call" decorative size={14} />
          {t("history.redial")}
        </Button>
      </div>

      <div className={styles.infoGroup}>
        <DetailRow label={t("history.detail.field.direction")} value={entry.directionLabel} />
        <DetailRow label={t("history.detail.field.outcome")} value={entry.outcomeLabel} />
        <DetailRow label={t("history.detail.field.date")} value={entry.dateLabel} />
        <DetailRow label={t("history.detail.field.time")} value={entry.timeLabel} />
        <DetailRow label={t("history.detail.field.duration")} value={entry.durationLabel} />
      </div>

      <div className={styles.dangerGroup}>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          fullWidth
          className={styles.deleteActionButton ?? ""}
          data-testid="history-detail-delete"
          onClick={onDelete}
        >
          {t("history.delete")}
        </Button>
      </div>
    </div>
  );
}

type DetailRowProps = Readonly<{
  label: string;
  value: string;
}>;

function DetailRow({ label, value }: DetailRowProps): JSX.Element {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <p className={styles.detailValue}>{value}</p>
    </div>
  );
}
