/**
 * - Purpose: electron_window lifecycle controls for External Applications.
 * - Inputs: windowBehavior draft, busy flag, partial update callback.
 * - Outputs: raise/always-on-top switches and onCallEnded illustrated cards.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { FormField, Switch } from "../../ui/index.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./ExternalApplications.module.css";
import { OnCallEndedChoiceCards } from "./OnCallEndedChoiceCards.js";

type WindowBehavior = ExternalApplicationsPanelApplication["windowBehavior"];

export type ExternalApplicationsWindowBehaviorProps = Readonly<{
  windowBehavior: WindowBehavior;
  disabled: boolean;
  onChange: (next: Partial<WindowBehavior>) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsWindowBehavior({
  windowBehavior,
  disabled,
  onChange,
}: ExternalApplicationsWindowBehaviorProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section
      className={styles.windowBehaviorSection}
      data-testid="external-applications-window-behavior"
    >
      <h4 className={styles.sectionTitle}>
        {t("settings.integrations.externalApplications.windowBehavior.title")}
      </h4>
      <div className={styles.editorGridSize}>
        <FormField
          label={t("settings.integrations.externalApplications.windowBehavior.raiseOnOpen")}
          hint={t(
            "settings.integrations.externalApplications.windowBehavior.raiseOnOpen.description",
          )}
        >
          <Switch
            checked={windowBehavior.raiseOnOpen}
            disabled={disabled}
            aria-label={t(
              "settings.integrations.externalApplications.windowBehavior.raiseOnOpen",
            )}
            onCheckedChange={(raiseOnOpen) => {
              onChange({ raiseOnOpen });
            }}
          />
        </FormField>
        <FormField
          label={t(
            "settings.integrations.externalApplications.windowBehavior.alwaysOnTop",
          )}
          hint={t(
            "settings.integrations.externalApplications.windowBehavior.alwaysOnTop.description",
          )}
        >
          <Switch
            checked={windowBehavior.alwaysOnTopDuringCall}
            disabled={disabled}
            aria-label={t(
              "settings.integrations.externalApplications.windowBehavior.alwaysOnTop",
            )}
            onCheckedChange={(alwaysOnTopDuringCall) => {
              onChange({ alwaysOnTopDuringCall });
            }}
          />
        </FormField>
      </div>
      <OnCallEndedChoiceCards
        value={windowBehavior.onCallEnded}
        disabled={disabled}
        onChange={(onCallEnded) => {
          onChange({ onCallEnded });
        }}
      />
    </section>
  );
}
