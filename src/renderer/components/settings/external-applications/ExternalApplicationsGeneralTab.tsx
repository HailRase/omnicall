/**
 * - Purpose: General tab fields for one External Application draft.
 * - Inputs: open mode, window size, window behavior, busy flag, change callback.
 * - Outputs: presentational open-mode, size, and lifecycle intents.
 */

import type { ChangeEvent, JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { FormField, Input } from "../../ui/index.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./ExternalApplications.module.css";
import { ExternalApplicationsWindowBehavior } from "./ExternalApplicationsWindowBehavior.js";
import { OpenModeChoiceCards } from "./OpenModeChoiceCards.js";

const MIN_WIDTH = 320;
const MAX_WIDTH = 3840;
const MIN_HEIGHT = 240;
const MAX_HEIGHT = 2160;

export type ExternalApplicationsGeneralTabProps = Readonly<{
  application: ExternalApplicationsPanelApplication;
  busy: boolean;
  onChange: (application: ExternalApplicationsPanelApplication) => void;
}>;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function updateNumber(
  event: ChangeEvent<HTMLInputElement>,
  current: number,
  minimum: number,
  maximum: number,
): number {
  const value = Number(event.currentTarget.value);
  return Number.isFinite(value) ? clamp(value, minimum, maximum) : current;
}

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsGeneralTab({
  application,
  busy,
  onChange,
}: ExternalApplicationsGeneralTabProps): JSX.Element {
  const { t } = useI18n();
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
      <div className={styles.editorGridSize}>
        <FormField label={t("settings.integrations.externalApplications.window.width")}>
          <Input
            type="number"
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            value={application.window.width}
            disabled={busy || windowOnly}
            onChange={(event) => {
              update({
                window: {
                  ...application.window,
                  width: updateNumber(event, application.window.width, MIN_WIDTH, MAX_WIDTH),
                },
              });
            }}
          />
        </FormField>
        <FormField label={t("settings.integrations.externalApplications.window.height")}>
          <Input
            type="number"
            min={MIN_HEIGHT}
            max={MAX_HEIGHT}
            value={application.window.height}
            disabled={busy || windowOnly}
            onChange={(event) => {
              update({
                window: {
                  ...application.window,
                  height: updateNumber(
                    event,
                    application.window.height,
                    MIN_HEIGHT,
                    MAX_HEIGHT,
                  ),
                },
              });
            }}
          />
        </FormField>
      </div>

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
    </div>
  );
}
