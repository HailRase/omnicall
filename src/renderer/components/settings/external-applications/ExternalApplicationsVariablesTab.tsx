/**
 * - Purpose: Variables tab for one External Application draft.
 * - Inputs: variables list, busy flag, change callback.
 * - Outputs: authored variable row intents plus shared system catalog browse.
 */

import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button, Input } from "../../ui/index.js";
import { ExternalServicesSystemVariablesHelp } from "../external-services/ExternalServicesSystemVariablesHelp.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./ExternalApplications.module.css";

export type ExternalApplicationsVariablesTabProps = Readonly<{
  application: ExternalApplicationsPanelApplication;
  busy: boolean;
  onChange: (application: ExternalApplicationsPanelApplication) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsVariablesTab({
  application,
  busy,
  onChange,
}: ExternalApplicationsVariablesTabProps): JSX.Element {
  const { t } = useI18n();
  const update = (next: Partial<ExternalApplicationsPanelApplication>): void => {
    onChange({ ...application, ...next });
  };

  return (
    <div className={styles.variablesStack} data-testid="external-applications-variables">
      <ExternalServicesSystemVariablesHelp enableInsert={false} />

      <section className={styles.variables} aria-labelledby="external-applications-variables">
        <div className={styles.variablesHeader}>
          <div className={styles.variablesHeaderText}>
            <h4 id="external-applications-variables" className={styles.sectionTitle}>
              {t("settings.integrations.externalApplications.variables")}
            </h4>
            <p className={styles.variablesWhenHint}>
              {t("settings.integrations.externalApplications.variablesWhenHint")}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            data-testid="external-applications-variables-add"
            onClick={() => {
              update({ variables: [...application.variables, { key: "", value: "" }] });
            }}
          >
            {t("settings.integrations.externalApplications.variablesAdd")}
          </Button>
        </div>
        {application.variables.map((variable, index) => (
          <div className={styles.variableRow} key={`${variable.key}-${index}`}>
            <Input
              value={variable.key}
              disabled={busy}
              aria-label={t("settings.integrations.externalApplications.variableKey")}
              onChange={(event) => {
                const variables = application.variables.map((current, currentIndex) =>
                  currentIndex === index ? { ...current, key: event.currentTarget.value } : current,
                );
                update({ variables });
              }}
            />
            <Input
              value={variable.value}
              disabled={busy}
              aria-label={t("settings.integrations.externalApplications.variableValue")}
              onChange={(event) => {
                const variables = application.variables.map((current, currentIndex) =>
                  currentIndex === index
                    ? { ...current, value: event.currentTarget.value }
                    : current,
                );
                update({ variables });
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                update({
                  variables: application.variables.filter(
                    (_, currentIndex) => currentIndex !== index,
                  ),
                });
              }}
            >
              {t("settings.integrations.externalApplications.actions.delete")}
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
