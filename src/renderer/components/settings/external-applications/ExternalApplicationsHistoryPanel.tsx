/**
 * - Purpose: present External Applications open history.
 * - Inputs: journal entries, load state, retry intent.
 * - Outputs: compact accessible history list.
 */

import type { JSX } from "react";
import type { ExternalApplicationsJournalEntryVm } from "@application/index.js";
import { useI18n, type TranslationKey } from "../../../i18n/index.js";
import { Button } from "../../ui/index.js";
import styles from "./ExternalApplications.module.css";

export type ExternalApplicationsHistoryPanelProps = Readonly<{
  entries: ReadonlyArray<ExternalApplicationsJournalEntryVm>;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}>;

const OUTCOME_KEYS: Readonly<
  Record<ExternalApplicationsJournalEntryVm["outcome"], TranslationKey>
> = {
  opened: "settings.integrations.externalApplications.history.outcome.opened",
  focused_existing:
    "settings.integrations.externalApplications.history.outcome.focused_existing",
  skipped_condition:
    "settings.integrations.externalApplications.history.outcome.skipped_condition",
  skipped_invalid_url:
    "settings.integrations.externalApplications.history.outcome.skipped_invalid_url",
  skipped_lifecycle:
    "settings.integrations.externalApplications.history.outcome.skipped_lifecycle",
  failed: "settings.integrations.externalApplications.history.outcome.failed",
};

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsHistoryPanel({
  entries,
  loading,
  error,
  onRetry,
}: ExternalApplicationsHistoryPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section
      className={styles.historyPanel}
      data-testid="external-applications-history"
    >
      <header className={styles.historyHeader}>
        <h3 className={styles.sectionTitle}>
          {t("settings.integrations.externalApplications.history.title")}
        </h3>
      </header>

      {loading ? (
        <p className={styles.historyMuted} role="status">
          {t("settings.integrations.externalApplications.history.loading")}
        </p>
      ) : null}

      {error ? (
        <div className={styles.historyError} role="alert">
          <p>{t("settings.integrations.externalApplications.history.loadFailed")}</p>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            {t("settings.integrations.externalApplications.history.retry")}
          </Button>
        </div>
      ) : null}

      {!loading && !error && entries.length === 0 ? (
        <p className={styles.historyMuted} data-testid="external-applications-history-empty">
          {t("settings.integrations.externalApplications.history.empty")}
        </p>
      ) : null}

      {!loading && !error && entries.length > 0 ? (
        <ul className={styles.historyList}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.historyRow}>
              <div className={styles.historyRowMain}>
                <span className={styles.historyAppName}>{entry.applicationName}</span>
                <span
                  className={styles.historyOutcome}
                  data-outcome={entry.outcome}
                >
                  {t(OUTCOME_KEYS[entry.outcome])}
                </span>
              </div>
              <div className={styles.historyRowMeta}>
                <span>{formatTime(entry.startedAt)}</span>
                <span>{entry.eventType}</span>
                {entry.skipReason !== null ? <span>{entry.skipReason}</span> : null}
              </div>
              {entry.resolvedUrl !== null ? (
                <p className={styles.historyUrl}>{entry.resolvedUrl}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}
