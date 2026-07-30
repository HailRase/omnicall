import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/index.js";
import type { ExternalServicesJournalProps } from "./ExternalServicesJournal.js";
import { ExternalServicesResponsePane } from "./ExternalServicesResponsePane.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesRequestsViewProps = Readonly<{
  collection: Readonly<{
    id: string;
    name: string;
    enabled: boolean;
    enabledRequestCount: number;
    requestCount: number;
    variables: ReadonlyArray<Readonly<{ key: string; value: string }>>;
  }>;
  busy: boolean;
  journal: ExternalServicesJournalProps;
  onCreate: () => void;
  onEditVariables: () => void;
}>;

/**
 * - Purpose: collection workspace when no request is selected.
 * - Inputs: collection summary, journal props, create/variables intents.
 * - Outputs: Postman-like empty-folder and variables surface.
 * @uiMeta f=F-031
 */
export function ExternalServicesRequestsView({
  collection,
  busy,
  journal,
  onCreate,
  onEditVariables,
}: ExternalServicesRequestsViewProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section className={styles.collectionWorkspace} data-testid="external-services-requests">
      <header className={styles.editorTopBar}>
        <nav className={styles.breadcrumb} aria-label={t("settings.integrations.externalServices.workspace.breadcrumb")}>
          <span className={styles.breadcrumbItem}>{collection.name}</span>
        </nav>
        <div className={styles.editorTopActions}>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onEditVariables}>
            {t("settings.integrations.externalServices.actions.editVariables")}
          </Button>
          <Button type="button" size="sm" disabled={busy} data-testid="external-services-create-request" onClick={onCreate}>
            {t("settings.integrations.externalServices.requests.create")}
          </Button>
        </div>
      </header>

      <div className={styles.editorSplit}>
        <div className={styles.editorTabsPane}>
          {collection.requestCount === 0 ? (
            <div className={styles.emptyFolderCard}>
              <p className={styles.emptyTitle}>{t("settings.integrations.externalServices.sidebar.emptyCollection")}</p>
              <p className={styles.emptyDescription}>
                {t("settings.integrations.externalServices.requests.emptyTitle")}
              </p>
              <div className={styles.emptyActions}>
                <Button type="button" disabled={busy} onClick={onCreate}>
                  {t("settings.integrations.externalServices.requests.create")}
                </Button>
              </div>
            </div>
          ) : (
            <section className={styles.variablesTable} data-testid="external-services-collection-variables">
              <h4 className={styles.sectionTitle}>
                {t("settings.integrations.externalServices.requests.variablesTitle")}
              </h4>
              <p className={styles.description}>
                {t("settings.integrations.externalServices.requests.enabledCount", {
                  enabled: collection.enabledRequestCount,
                  total: collection.requestCount,
                })}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("settings.integrations.externalServices.collections.variablesKey")}</TableHead>
                    <TableHead>{t("settings.integrations.externalServices.collections.variablesValue")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collection.variables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        {t("settings.integrations.externalServices.collections.variablesEmpty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    collection.variables.map((variable) => (
                      <TableRow key={variable.key}>
                        <TableCell>{variable.key}</TableCell>
                        <TableCell>{variable.value}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </section>
          )}
        </div>
        <ExternalServicesResponsePane runState="idle" runResult={null} journal={journal} />
      </div>
    </section>
  );
}
