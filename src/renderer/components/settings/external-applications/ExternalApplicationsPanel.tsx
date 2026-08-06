/**
 * - Purpose: compose the External Applications Settings workspace.
 * - Inputs: application list, selection, history, action callbacks.
 * - Outputs: presentational sidebar and editor, history, or welcome state.
 */

import type { JSX } from "react";
import type { ExternalApplicationsJournalEntryVm } from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import type { ExternalServicesAutomaticEventType } from "../external-services/ExternalServicesTriggerList.js";
import { ExternalApplicationsDiscardDialog } from "./ExternalApplicationsDiscardDialog.js";
import { ExternalApplicationsEditor } from "./ExternalApplicationsEditor.js";
import { ExternalApplicationsHistoryPanel } from "./ExternalApplicationsHistoryPanel.js";
import { ExternalApplicationsSidebar } from "./ExternalApplicationsSidebar.js";
import styles from "./ExternalApplications.module.css";

export type ExternalApplicationsSidebarSelection =
  | Readonly<{ kind: "application"; id: ExternalApplicationsPanelApplication["id"] }>
  | Readonly<{ kind: "history" }>;

export type ExternalApplicationsPanelProps = Readonly<{
  applications: ReadonlyArray<ExternalApplicationsPanelApplication>;
  selectedApplication: ExternalApplicationsPanelApplication | null;
  selection: ExternalApplicationsSidebarSelection | null;
  historyEntries: ReadonlyArray<ExternalApplicationsJournalEntryVm>;
  historyLoading: boolean;
  historyError: boolean;
  busy: boolean;
  loadError: boolean;
  forceNameEditKey: number;
  isDirty: boolean;
  discardDialogOpen: boolean;
  onDiscardDialogOpenChange: (open: boolean) => void;
  onDiscardConfirm: () => void;
  onSelectApplication: (id: ExternalApplicationsPanelApplication["id"]) => void;
  onSelectHistory: () => void;
  onRetryHistory: () => void;
  onCreate: () => void;
  onToggle: (id: ExternalApplicationsPanelApplication["id"], enabled: boolean) => void;
  onRename: (id: ExternalApplicationsPanelApplication["id"]) => void;
  onDuplicate: (id: ExternalApplicationsPanelApplication["id"]) => void;
  onDelete: (id: ExternalApplicationsPanelApplication["id"]) => void;
  onChange: (application: ExternalApplicationsPanelApplication) => void;
  onSave: () => void;
  onOpenNow: () => void;
}>;

export type ExternalApplicationsPanelApplication = Readonly<{
  id: string & { readonly __brand: "ExternalApplicationId" };
  name: string;
  enabled: boolean;
  urlTemplate: string;
  openMode: "electron_window" | "external_browser";
  window: Readonly<{ width: number; height: number; x: number; y: number }>;
  variables: ReadonlyArray<Readonly<{ key: string; value: string }>>;
  triggers: ReadonlyArray<
    Readonly<{ eventType: ExternalServicesAutomaticEventType; delaySeconds: number }>
  >;
  conditions: Readonly<{
    callDirection: "any" | "inbound" | "outbound";
    queueNames: ReadonlyArray<string>;
  }>;
  windowBehavior: Readonly<{
    raiseOnOpen: boolean;
    alwaysOnTopDuringCall: boolean;
    onCallEnded: "leave" | "minimize" | "close";
  }>;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsPanel({
  applications,
  selectedApplication,
  selection,
  historyEntries,
  historyLoading,
  historyError,
  busy,
  loadError,
  forceNameEditKey,
  isDirty,
  discardDialogOpen,
  onDiscardDialogOpenChange,
  onDiscardConfirm,
  onSelectApplication,
  onSelectHistory,
  onRetryHistory,
  onCreate,
  onToggle,
  onRename,
  onDuplicate,
  onDelete,
  onChange,
  onSave,
  onOpenNow,
}: ExternalApplicationsPanelProps): JSX.Element {
  const { t } = useI18n();
  const historySelected = selection?.kind === "history";

  return (
    <div className={styles.workspace} data-testid="external-applications-panel">
      <ExternalApplicationsSidebar
        applications={applications}
        selectedId={selectedApplication?.id ?? null}
        historySelected={historySelected}
        busy={busy}
        isDirty={isDirty}
        onSelect={onSelectApplication}
        onSelectHistory={onSelectHistory}
        onCreate={onCreate}
        onToggle={onToggle}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
      <div className={styles.mainPane}>
        {loadError ? (
          <p className={styles.error} role="alert">
            {t("settings.integrations.externalApplications.validation.loadFailed")}
          </p>
        ) : historySelected ? (
          <ExternalApplicationsHistoryPanel
            entries={historyEntries}
            loading={historyLoading}
            error={historyError}
            onRetry={onRetryHistory}
          />
        ) : selectedApplication === null ? (
          <div className={styles.welcome}>
            <h4 className={styles.welcomeTitle}>
              {t("settings.integrations.externalApplications.welcome")}
            </h4>
            <p className={styles.welcomeDescription}>
              {t("settings.integrations.externalApplications.empty")}
            </p>
          </div>
        ) : (
          <ExternalApplicationsEditor
            application={selectedApplication}
            applications={applications}
            busy={busy}
            forceNameEditKey={forceNameEditKey}
            isDirty={isDirty}
            onChange={onChange}
            onSave={onSave}
            onOpenNow={onOpenNow}
          />
        )}
      </div>
      <ExternalApplicationsDiscardDialog
        open={discardDialogOpen}
        onOpenChange={onDiscardDialogOpenChange}
        onConfirm={onDiscardConfirm}
      />
    </div>
  );
}
