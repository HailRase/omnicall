/**
 * - Purpose: General tab fields for one External Application draft.
 * - Inputs: open mode, peers list, window geometry, behavior, busy, change callback.
 * - Outputs: presentational open-mode, lifecycle, and geometry intents.
 */

import type { JSX } from "react";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./ExternalApplications.module.css";
import { ExternalApplicationsWindowBehavior } from "./ExternalApplicationsWindowBehavior.js";
import { OpenModeChoiceCards } from "./OpenModeChoiceCards.js";
import { WindowGeometryEditor } from "./WindowGeometryEditor.js";

export type ExternalApplicationsGeneralTabProps = Readonly<{
  application: ExternalApplicationsPanelApplication;
  applications: ReadonlyArray<ExternalApplicationsPanelApplication>;
  busy: boolean;
  onChange: (application: ExternalApplicationsPanelApplication) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsGeneralTab({
  application,
  applications,
  busy,
  onChange,
}: ExternalApplicationsGeneralTabProps): JSX.Element {
  const windowOnly = application.openMode !== "electron_window";
  const update = (next: Partial<ExternalApplicationsPanelApplication>): void => {
    onChange({ ...application, ...next });
  };

  return (
    <div className={styles.generalTab}>
      <OpenModeChoiceCards
        value={application.openMode}
        disabled={busy}
        onChange={(openMode) => {
          update({ openMode });
        }}
      />

      {!windowOnly ? (
        <ExternalApplicationsWindowBehavior
          windowBehavior={application.windowBehavior}
          disabled={busy || windowOnly}
          onChange={(next) => {
            update({
              windowBehavior: { ...application.windowBehavior, ...next },
            });
          }}
        />
      ) : null}

      {!windowOnly ? (
        <WindowGeometryEditor
          window={application.window}
          applicationName={application.name}
          disabled={busy || windowOnly}
          currentApplicationId={application.id}
          applications={applications}
          onChange={(window) => {
            update({ window });
          }}
        />
      ) : null}
    </div>
  );
}
