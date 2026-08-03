/**
 * - Purpose: electron_window lifecycle controls for External Applications.
 * - Inputs: windowBehavior draft, busy flag, partial update callback.
 * - Outputs: raise/always-on-top switch rows with previews and onCallEnded cards.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./ExternalApplications.module.css";
import { OnCallEndedChoiceCards } from "./OnCallEndedChoiceCards.js";
import { WindowBehaviorSwitchRow } from "./WindowBehaviorSwitchRow.js";
import switchStyles from "./WindowBehaviorSwitchPreview.module.css";
import {
  AlwaysOnTopSchematic,
  RaiseOnOpenSchematic,
} from "./WindowBehaviorSwitchSchematics.js";

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
  const labels = {
    softphone: t("settings.integrations.externalApplications.openMode.preview.softphone"),
    appWindow: t("settings.integrations.externalApplications.openMode.preview.appWindow"),
    otherWindow: t(
      "settings.integrations.externalApplications.windowBehavior.preview.otherWindow",
    ),
  };

  return (
    <section
      className={styles.windowBehaviorSection}
      data-testid="external-applications-window-behavior"
    >
      <h4 className={styles.sectionTitle}>
        {t("settings.integrations.externalApplications.windowBehavior.title")}
      </h4>
      <div className={switchStyles.group}>
        <WindowBehaviorSwitchRow
          checked={windowBehavior.raiseOnOpen}
          disabled={disabled}
          label={t("settings.integrations.externalApplications.windowBehavior.raiseOnOpen")}
          hint={t(
            "settings.integrations.externalApplications.windowBehavior.raiseOnOpen.description",
          )}
          testId="external-applications-raise-on-open"
          schematic={
            <RaiseOnOpenSchematic active={windowBehavior.raiseOnOpen} {...labels} />
          }
          onCheckedChange={(raiseOnOpen) => {
            onChange({ raiseOnOpen });
          }}
        />
        <WindowBehaviorSwitchRow
          checked={windowBehavior.alwaysOnTopDuringCall}
          disabled={disabled}
          label={t("settings.integrations.externalApplications.windowBehavior.alwaysOnTop")}
          hint={t(
            "settings.integrations.externalApplications.windowBehavior.alwaysOnTop.description",
          )}
          testId="external-applications-always-on-top"
          schematic={
            <AlwaysOnTopSchematic
              active={windowBehavior.alwaysOnTopDuringCall}
              {...labels}
            />
          }
          onCheckedChange={(alwaysOnTopDuringCall) => {
            onChange({ alwaysOnTopDuringCall });
          }}
        />
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
