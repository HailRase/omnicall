/**
 * - Purpose: General tab fields for one External Application draft.
 * - Inputs: open mode, window size, window behavior, busy flag, change callback.
 * - Outputs: presentational open-mode, size, and lifecycle intents.
 */

import type { ChangeEvent, JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { FormField, Input, Select, Switch } from "../../ui/index.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./ExternalApplications.module.css";

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
  const updateBehavior = (
    next: Partial<ExternalApplicationsPanelApplication["windowBehavior"]>,
  ): void => {
    update({
      windowBehavior: { ...application.windowBehavior, ...next },
    });
  };

  return (
    <div className={styles.generalTab}>
      <div className={styles.editorGrid}>
        <FormField label={t("settings.integrations.externalApplications.openMode")}>
          <Select
            value={application.openMode}
            disabled={busy}
            items={[
              {
                value: "electron_window",
                label: t(
                  "settings.integrations.externalApplications.openMode.electronWindow",
                ),
              },
              {
                value: "external_browser",
                label: t(
                  "settings.integrations.externalApplications.openMode.externalBrowser",
                ),
              },
            ]}
            onValueChange={(openMode) => {
              if (openMode === "electron_window" || openMode === "external_browser") {
                update({ openMode });
              }
            }}
          />
        </FormField>
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

      <section
        className={styles.windowBehaviorSection}
        data-testid="external-applications-window-behavior"
      >
        <h4 className={styles.sectionTitle}>
          {t("settings.integrations.externalApplications.windowBehavior.title")}
        </h4>
        <div className={styles.editorGrid}>
          <FormField
            label={t("settings.integrations.externalApplications.windowBehavior.raiseOnOpen")}
          >
            <div className={styles.switchRow}>
              <Switch
                checked={application.windowBehavior.raiseOnOpen}
                disabled={busy || windowOnly}
                aria-label={t(
                  "settings.integrations.externalApplications.windowBehavior.raiseOnOpen",
                )}
                onCheckedChange={(raiseOnOpen) => {
                  updateBehavior({ raiseOnOpen });
                }}
              />
            </div>
          </FormField>
          <FormField
            label={t(
              "settings.integrations.externalApplications.windowBehavior.alwaysOnTop",
            )}
          >
            <div className={styles.switchRow}>
              <Switch
                checked={application.windowBehavior.alwaysOnTopDuringCall}
                disabled={busy || windowOnly}
                aria-label={t(
                  "settings.integrations.externalApplications.windowBehavior.alwaysOnTop",
                )}
                onCheckedChange={(alwaysOnTopDuringCall) => {
                  updateBehavior({ alwaysOnTopDuringCall });
                }}
              />
            </div>
          </FormField>
          <FormField
            label={t(
              "settings.integrations.externalApplications.windowBehavior.onCallEnded",
            )}
          >
            <Select
              value={application.windowBehavior.onCallEnded}
              disabled={busy || windowOnly}
              items={[
                {
                  value: "leave",
                  label: t(
                    "settings.integrations.externalApplications.windowBehavior.onCallEnded.leave",
                  ),
                },
                {
                  value: "minimize",
                  label: t(
                    "settings.integrations.externalApplications.windowBehavior.onCallEnded.minimize",
                  ),
                },
                {
                  value: "close",
                  label: t(
                    "settings.integrations.externalApplications.windowBehavior.onCallEnded.close",
                  ),
                },
              ]}
              onValueChange={(onCallEnded) => {
                if (
                  onCallEnded === "leave" ||
                  onCallEnded === "minimize" ||
                  onCallEnded === "close"
                ) {
                  updateBehavior({ onCallEnded });
                }
              }}
            />
          </FormField>
        </div>
      </section>
    </div>
  );
}
