import type { JSX } from "react";
import type { ExternalServicesJournalPanelVm } from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import { Accordion, Button } from "../../ui/index.js";
import { Skeleton } from "../../ui/skeleton/index.js";
import { ExternalServicesJournalEntry } from "./ExternalServicesJournalEntry.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesJournalProps = Readonly<{
  panel: ExternalServicesJournalPanelVm;
  onRetry: () => void;
}>;

/**
 * - Purpose: present capped External Services attempt journal with expandable diagnostics.
 * - Inputs: safe journal panel VM and retry intent.
 * - Outputs: accessible accordion list without redaction or HTTP control.
 * @uiMeta f=F-031
 */
export function ExternalServicesJournal({
  panel,
  onRetry,
}: ExternalServicesJournalProps): JSX.Element {
  const { t, language } = useI18n();

  return (
    <section
      className={styles.journalSection}
      data-testid="external-services-journal-section"
    >
      {panel.loadState === "loading" ? (
        <div className={styles.loadingStack} aria-busy="true">
          <Skeleton shape="rectangle" height={32} />
          <Skeleton shape="rectangle" height={32} />
        </div>
      ) : null}

      {panel.loadState === "error" || panel.loadState === "unavailable" ? (
        <div
          className={styles.journalLoadError}
          role="alert"
          data-testid="external-services-journal"
        >
          <p className={styles.journalLoadErrorText}>
            {t("settings.integrations.externalServices.journal.loadError")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="external-services-journal-retry"
            onClick={onRetry}
          >
            {t("settings.integrations.externalServices.journal.retry")}
          </Button>
        </div>
      ) : null}

      {panel.loadState === "ready" && panel.entries.length === 0 ? (
        <div className={styles.empty} data-testid="external-services-journal-empty">
          <p className={styles.emptyTitle}>
            {t("settings.integrations.externalServices.journal.emptyTitle")}
          </p>
          <p className={styles.emptyDescription}>
            {t("settings.integrations.externalServices.journal.emptyDescription")}
          </p>
        </div>
      ) : null}

      {panel.loadState === "ready" && panel.entries.length > 0 ? (
        <div data-testid="external-services-journal">
          {panel.capped ? (
            <p className={styles.credentialsNote} role="status">
              {t("settings.integrations.externalServices.journal.capHint")}
            </p>
          ) : null}
          <Accordion type="single" collapsible className={styles.journalList}>
            {panel.entries.map((entry) => (
              <ExternalServicesJournalEntry
                key={entry.id}
                entry={entry}
                language={language}
                t={t}
              />
            ))}
          </Accordion>
        </div>
      ) : null}
    </section>
  );
}
