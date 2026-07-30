import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/index.js";
import {
  ExternalServicesJournal,
  type ExternalServicesJournalProps,
} from "./ExternalServicesJournal.js";
import {
  ExternalServicesRunResult,
  type ExternalServicesRunResultValue,
} from "./ExternalServicesRunResult.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesResponsePaneProps = Readonly<{
  runState: "idle" | "queued" | "running";
  runResult: ExternalServicesRunResultValue | null;
  journal: ExternalServicesJournalProps;
}>;

/**
 * - Purpose: Postman-like response/history pane under the request workspace.
 * - Inputs: run state/result and journal panel props.
 * - Outputs: tabbed Response and History surfaces without HTTP logic.
 * @uiMeta f=F-031
 */
export function ExternalServicesResponsePane({
  runState,
  runResult,
  journal,
}: ExternalServicesResponsePaneProps): JSX.Element {
  const { t } = useI18n();
  const showEmpty =
    runState === "idle" && runResult === null;

  return (
    <section className={styles.responsePane} data-testid="external-services-response-pane">
      <Tabs defaultValue="response" className={styles.responseTabs}>
        <TabsList>
          <TabsTrigger value="response">
            {t("settings.integrations.externalServices.tabs.response")}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t("settings.integrations.externalServices.tabs.history")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="response" className={styles.responseTabContent}>
          {showEmpty ? (
            <div className={styles.responseEmpty} data-testid="external-services-response-empty">
              <p className={styles.responseEmptyText}>
                {t("settings.integrations.externalServices.workspace.responseEmpty")}
              </p>
            </div>
          ) : (
            <ExternalServicesRunResult result={runResult} runState={runState} />
          )}
        </TabsContent>
        <TabsContent value="history" className={styles.responseTabContent}>
          <ExternalServicesJournal {...journal} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
