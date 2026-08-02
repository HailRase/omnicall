/**
 * - Purpose: Conditions tab for External Applications open filters.
 * - Inputs: draft application, busy flag, change callback.
 * - Outputs: presentational direction and multi-queue intents.
 */

import type { ChangeEvent, JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Button, FormField, Input, Select } from "../../ui/index.js";
import type { ExternalApplicationsPanelApplication } from "./ExternalApplicationsPanel.js";
import styles from "./ExternalApplications.module.css";

export type ExternalApplicationsConditionsSectionProps = Readonly<{
  application: ExternalApplicationsPanelApplication;
  busy: boolean;
  onChange: (application: ExternalApplicationsPanelApplication) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function ExternalApplicationsConditionsSection({
  application,
  busy,
  onChange,
}: ExternalApplicationsConditionsSectionProps): JSX.Element {
  const { t } = useI18n();
  const { conditions } = application;

  const updateConditions = (
    next: Partial<ExternalApplicationsPanelApplication["conditions"]>,
  ): void => {
    onChange({
      ...application,
      conditions: { ...conditions, ...next },
    });
  };

  return (
    <section
      className={styles.conditionsTab}
      data-testid="external-applications-conditions"
    >
      <FormField
        label={t("settings.integrations.externalApplications.conditions.direction")}
      >
        <Select
          value={conditions.callDirection}
          disabled={busy}
          items={[
            {
              value: "any",
              label: t(
                "settings.integrations.externalApplications.conditions.direction.any",
              ),
            },
            {
              value: "inbound",
              label: t(
                "settings.integrations.externalApplications.conditions.direction.inbound",
              ),
            },
            {
              value: "outbound",
              label: t(
                "settings.integrations.externalApplications.conditions.direction.outbound",
              ),
            },
          ]}
          onValueChange={(callDirection) => {
            if (
              callDirection === "any" ||
              callDirection === "inbound" ||
              callDirection === "outbound"
            ) {
              updateConditions({ callDirection });
            }
          }}
        />
      </FormField>

      <div className={styles.variables}>
        <div className={styles.variablesHeader}>
          <h4 className={styles.sectionTitle}>
            {t("settings.integrations.externalApplications.conditions.queues")}
          </h4>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            data-testid="external-applications-condition-queue-add"
            onClick={() => {
              updateConditions({ queueNames: [...conditions.queueNames, ""] });
            }}
          >
            {t("settings.integrations.externalApplications.conditions.queuesAdd")}
          </Button>
        </div>
        {conditions.queueNames.length === 0 ? (
          <p className={styles.historyMuted}>
            {t("settings.integrations.externalApplications.conditions.queuesEmpty")}
          </p>
        ) : null}
        {conditions.queueNames.map((queueName, index) => (
          <div className={styles.queueRow} key={`queue-${index}`}>
            <Input
              value={queueName}
              disabled={busy}
              placeholder={t(
                "settings.integrations.externalApplications.conditions.queuePlaceholder",
              )}
              data-testid={`external-applications-condition-queue-${index}`}
              aria-label={t(
                "settings.integrations.externalApplications.conditions.queues",
              )}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const queueNames = conditions.queueNames.map((current, currentIndex) =>
                  currentIndex === index ? event.currentTarget.value : current,
                );
                updateConditions({ queueNames });
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                updateConditions({
                  queueNames: conditions.queueNames.filter(
                    (_, currentIndex) => currentIndex !== index,
                  ),
                });
              }}
            >
              {t("settings.integrations.externalApplications.actions.delete")}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
