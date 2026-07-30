import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { ExternalServicesJournalProps } from "./ExternalServicesJournal.js";
import { ExternalServicesResponsePane } from "./ExternalServicesResponsePane.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesWelcomeProps = Readonly<{
  journal: ExternalServicesJournalProps;
}>;

/**
 * - Purpose: empty Postman workspace when no collection or request is selected.
 * - Inputs: journal panel props for History tab.
 * - Outputs: select-prompt and response/history chrome only.
 * @uiMeta f=F-031
 */
export function ExternalServicesWelcome({ journal }: ExternalServicesWelcomeProps): JSX.Element {
  const { t } = useI18n();
  return (
    <section className={styles.collectionWorkspace} data-testid="external-services-welcome">
      <div className={styles.editorSplit}>
        <div className={styles.welcomePane}>
          <p className={styles.emptyTitle}>{t("settings.integrations.externalServices.workspace.selectPrompt")}</p>
          <p className={styles.emptyDescription}>{t("settings.integrations.externalServices.description")}</p>
          <p className={styles.credentialsNote}>
            {t("settings.integrations.externalServices.importExport.credentialsNote")}
          </p>
        </div>
        <ExternalServicesResponsePane runState="idle" runResult={null} journal={journal} />
      </div>
    </section>
  );
}
