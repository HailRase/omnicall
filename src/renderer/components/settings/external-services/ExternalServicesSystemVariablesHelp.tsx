import { useState, type JSX } from "react";
import {
  EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS,
  formatExternalServiceVariableToken,
  listExternalServiceVariableCatalogByGroup,
} from "@application/index.js";
import { useI18n } from "../../../i18n/index.js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from "../../ui/index.js";
import { ExternalServicesVariableHelpButton } from "./ExternalServicesVariableHelpButton.js";
import {
  EXTERNAL_SERVICES_VARIABLE_GROUP_TITLE_KEYS,
  EXTERNAL_SERVICES_VARIABLE_GROUP_WHEN_KEYS,
  EXTERNAL_SERVICES_VARIABLE_HELP_KEYS,
  EXTERNAL_SERVICES_VARIABLE_LABEL_KEYS,
} from "./externalServicesVariableI18nKeys.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesVariableInsertTarget = "url" | "body";

export type ExternalServicesSystemVariablesHelpProps = Readonly<{
  insertTarget?: ExternalServicesVariableInsertTarget;
  bodyInsertAvailable?: boolean;
  onInsertToken?: (token: string) => void;
  /** When false, catalog is browse-only (no Insert / target line). Default true. */
  enableInsert?: boolean;
}>;

/**
 * - Purpose: compact system template catalog with optional insert into URL/body.
 * - Inputs: insert target, body availability, insert callback, optional insert mode.
 * - Outputs: presentational catalog intents only.
 * @uiMeta f=F-031
 */
export function ExternalServicesSystemVariablesHelp({
  insertTarget = "url",
  bodyInsertAvailable = false,
  onInsertToken,
  enableInsert = true,
}: ExternalServicesSystemVariablesHelpProps): JSX.Element {
  const { t } = useI18n();
  const [openGroups, setOpenGroups] = useState<string[]>(["always", "call"]);
  const canInsert = enableInsert && onInsertToken !== undefined;
  const targetLabel =
    insertTarget === "body" && bodyInsertAvailable
      ? t("settings.integrations.externalServices.variables.insertTarget.body")
      : t("settings.integrations.externalServices.variables.insertTarget.url");

  return (
    <section
      className={styles.systemVariablesHelp}
      data-testid="external-services-system-variables"
    >
      <p className={styles.systemVariablesIntro}>
        {t("settings.integrations.externalServices.variables.syntaxHint")}
      </p>
      <p className={styles.systemVariablesContextHint}>
        {t("settings.integrations.externalServices.variables.contextHint")}
      </p>
      {canInsert ? (
        <p
          className={styles.systemVariablesTarget}
          data-testid="external-services-variables-insert-target"
        >
          {t("settings.integrations.externalServices.variables.insertTargetLabel", {
            target: targetLabel,
          })}
        </p>
      ) : null}
      <Accordion
        type="multiple"
        value={openGroups}
        onValueChange={setOpenGroups}
        className={styles.systemVariablesAccordion}
      >
        {EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS.map((group) => (
          <AccordionItem value={group} key={group}>
            <AccordionTrigger>
              <span className={styles.systemVariablesGroupTrigger}>
                <span>{t(EXTERNAL_SERVICES_VARIABLE_GROUP_TITLE_KEYS[group])}</span>
                <span className={styles.systemVariablesGroupWhen}>
                  {t(EXTERNAL_SERVICES_VARIABLE_GROUP_WHEN_KEYS[group])}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className={styles.systemVariablesList}>
                {listExternalServiceVariableCatalogByGroup(group).map((entry) => {
                  const token = formatExternalServiceVariableToken(entry.name);
                  const labelKey = EXTERNAL_SERVICES_VARIABLE_LABEL_KEYS[entry.name];
                  const helpKey = EXTERNAL_SERVICES_VARIABLE_HELP_KEYS[entry.name];
                  const variableLabel =
                    labelKey !== undefined ? t(labelKey) : entry.name;
                  return (
                    <li
                      className={styles.systemVariablesRow}
                      key={`${group}-${entry.name}`}
                      data-testid={`external-services-variable-${entry.name}`}
                    >
                      <div className={styles.systemVariablesMeta}>
                        <div className={styles.systemVariablesTitleRow}>
                          <span className={styles.systemVariablesTitle}>{variableLabel}</span>
                          {helpKey !== undefined ? (
                            <ExternalServicesVariableHelpButton
                              variableLabel={variableLabel}
                              description={t(helpKey)}
                              testId={`external-services-variable-help-${entry.name}`}
                            />
                          ) : null}
                        </div>
                        <code className={styles.systemVariablesToken}>{token}</code>
                      </div>
                      {canInsert ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          data-testid={`external-services-variable-insert-${entry.name}`}
                          aria-label={t(
                            "settings.integrations.externalServices.variables.insertAria",
                            { token },
                          )}
                          onClick={() => onInsertToken(token)}
                        >
                          {t("settings.integrations.externalServices.variables.insert")}
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
