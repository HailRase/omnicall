/**
 * - Purpose: compose the External Applications Settings workspace.
 * - Inputs: application list, selected draft, action callbacks.
 * - Outputs: presentational sidebar and editor or welcome state.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { ExternalServicesAutomaticEventType } from "../external-services/ExternalServicesTriggerList.js";
import { ExternalApplicationsEditor } from "./ExternalApplicationsEditor.js";
import { ExternalApplicationsSidebar } from "./ExternalApplicationsSidebar.js";
import styles from "./ExternalApplications.module.css";

export type ExternalApplicationsPanelProps = Readonly<{
  applications: ReadonlyArray<ExternalApplicationsPanelApplication>;
  selectedApplication: ExternalApplicationsPanelApplication | null;
  busy: boolean;
  loadError: boolean;
  saveError: boolean;
  forceNameEditKey: number;
  onSelect: (id: ExternalApplicationsPanelApplication["id"]) => void;
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
  window: Readonly<{ width: number; height: number }>;
  variables: ReadonlyArray<Readonly<{ key: string; value: string }>>;
  triggers: ReadonlyArray<
    Readonly<{ eventType: ExternalServicesAutomaticEventType; delaySeconds: number }>
  >;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsPanel({
  applications,
  selectedApplication,
  busy,
  loadError,
  saveError,
  forceNameEditKey,
  onSelect,
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

  return (
    <div className={styles.workspace} data-testid="external-applications-panel">
      <ExternalApplicationsSidebar
        applications={applications}
        selectedId={selectedApplication?.id ?? null}
        busy={busy}
        onSelect={onSelect}
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
            busy={busy}
            saveError={saveError}
            forceNameEditKey={forceNameEditKey}
            onChange={onChange}
            onSave={onSave}
            onOpenNow={onOpenNow}
          />
        )}
      </div>
    </div>
  );
}
