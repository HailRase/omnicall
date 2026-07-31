import type { JSX } from "react";
import type { ExternalServicesJournalEntryVm } from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import styles from "./ExternalServices.module.css";

type Translator = ReturnType<typeof useI18n>["t"];

export type ExternalServicesJournalEntryDetailProps = Readonly<{
  entry: ExternalServicesJournalEntryVm;
  t: Translator;
}>;

/**
 * - Purpose: render safe expandable diagnostics for one journal attempt.
 * - Inputs: already-redacted entry VM and translator.
 * - Outputs: URL/headers/error/body detail without control actions.
 * @uiMeta f=F-031
 */
export function ExternalServicesJournalEntryDetail({
  entry,
  t,
}: ExternalServicesJournalEntryDetailProps): JSX.Element {
  return (
    <dl className={styles.journalDetail}>
      <div>
        <dt>{t("settings.integrations.externalServices.journal.url")}</dt>
        <dd className={styles.journalDetailValue}>{entry.requestUrl}</dd>
      </div>
      <div>
        <dt>{t("settings.integrations.externalServices.journal.headers")}</dt>
        <dd>
          {entry.requestHeaders.length === 0 ? (
            <span className={styles.journalDetailValue}>
              {t("settings.integrations.externalServices.journal.headersEmpty")}
            </span>
          ) : (
            <ul className={styles.journalHeaders}>
              {entry.requestHeaders.map((header) => (
                <li key={header.id}>
                  <code>{header.key}</code>:{" "}
                  <code data-testid={`external-services-journal-header-${header.id}`}>
                    {header.value}
                  </code>
                </li>
              ))}
            </ul>
          )}
        </dd>
      </div>
      {entry.errorMessage !== null || entry.errorCode !== null ? (
        <div>
          <dt>{t("settings.integrations.externalServices.journal.error")}</dt>
          <dd className={styles.journalDetailValue} role="status">
            {entry.errorCode !== null ? `${entry.errorCode}: ` : null}
            {entry.errorMessage ?? ""}
          </dd>
        </div>
      ) : null}
      {entry.responseBody.length > 0 ? (
        <div>
          <dt>{t("settings.integrations.externalServices.journal.body")}</dt>
          <dd>
            <pre className={styles.resultBody}>{entry.responseBody}</pre>
            {entry.responseBodyTruncated ? (
              <p className={styles.credentialsNote}>
                {t("settings.integrations.externalServices.journal.truncated")}
              </p>
            ) : null}
          </dd>
        </div>
      ) : null}
      {entry.responseBody.length === 0 && entry.responseBodyTruncated ? (
        <p className={styles.credentialsNote}>
          {t("settings.integrations.externalServices.journal.truncated")}
        </p>
      ) : null}
    </dl>
  );
}
