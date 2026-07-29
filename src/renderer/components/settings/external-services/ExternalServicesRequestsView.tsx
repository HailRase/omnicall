import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/index.js";
import type { ExternalServicesRequestSummary } from "./ExternalServicesRequestRow.js";
import { ExternalServicesRequestRow } from "./ExternalServicesRequestRow.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesRequestsViewProps = Readonly<{
  collection: Readonly<{ id: string; name: string; enabled: boolean; enabledRequestCount: number; requestCount: number; variables: ReadonlyArray<Readonly<{ key: string; value: string }>> }>;
  requests: ReadonlyArray<ExternalServicesRequestSummary>;
  busy: boolean;
  onBack: () => void;
  onCreate: () => void;
  onOpen: (requestId: string) => void;
  onToggle: (requestId: string, enabled: boolean) => void;
  onRename: (requestId: string) => void;
  onDuplicate: (requestId: string) => void;
  onDelete: (requestId: string) => void;
}>;

/** - Purpose: render requests belonging to a collection.
 * - Inputs: collection projection, request summaries, intent callbacks.
 * - Outputs: accessible request navigation and variables table.
 * @uiMeta f=F-031
 */
export function ExternalServicesRequestsView({
  collection, requests, busy, onBack, onCreate, onOpen, onToggle, onRename, onDuplicate, onDelete,
}: ExternalServicesRequestsViewProps): JSX.Element {
  const { t } = useI18n();
  return (
    <section className={styles.panel} data-testid="external-services-requests">
      <header className={styles.header}>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          {t("settings.integrations.externalServices.actions.back")}
        </Button>
        <h3 className={styles.screenTitle}>{collection.name}</h3>
        <p className={styles.description}>
          {t("settings.integrations.externalServices.requests.enabledCount", {
            enabled: collection.enabledRequestCount,
            total: collection.requestCount,
          })}
        </p>
        <Button type="button" disabled={busy} data-testid="external-services-create-request" onClick={onCreate}>
          {t("settings.integrations.externalServices.requests.create")}
        </Button>
      </header>
      <section className={styles.variablesTable} data-testid="external-services-collection-variables">
        <h4 className={styles.sectionTitle}>{t("settings.integrations.externalServices.requests.variablesTitle")}</h4>
        <Table>
          <TableHeader><TableRow><TableHead>{t("settings.integrations.externalServices.collections.variablesKey")}</TableHead><TableHead>{t("settings.integrations.externalServices.collections.variablesValue")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {collection.variables.map((variable) => <TableRow key={variable.key}><TableCell>{variable.key}</TableCell><TableCell>{variable.value}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </section>
      {requests.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t("settings.integrations.externalServices.requests.emptyTitle")}</p>
          <Button type="button" disabled={busy} onClick={onCreate}>{t("settings.integrations.externalServices.requests.create")}</Button>
        </div>
      ) : (
        <ul className={styles.list}>
          {requests.map((request) => <ExternalServicesRequestRow key={request.id} request={request} disabled={busy} onOpen={() => onOpen(request.id)} onToggle={(enabled) => onToggle(request.id, enabled)} onRename={() => onRename(request.id)} onDuplicate={() => onDuplicate(request.id)} onDelete={() => onDelete(request.id)} />)}
        </ul>
      )}
    </section>
  );
}
