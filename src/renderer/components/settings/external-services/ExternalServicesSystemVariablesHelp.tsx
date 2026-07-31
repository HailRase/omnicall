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
import {
  EXTERNAL_SERVICES_VARIABLE_DESCRIPTION_KEYS,
  EXTERNAL_SERVICES_VARIABLE_GROUP_TITLE_KEYS,
  EXTERNAL_SERVICES_VARIABLE_LABEL_KEYS,
} from "./externalServicesVariableI18nKeys.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesVariableInsertTarget = "url" | "body";

export type ExternalServicesSystemVariablesHelpProps = Readonly<{
  insertTarget: ExternalServicesVariableInsertTarget;
  bodyInsertAvailable: boolean;
  onInsertToken: (token: string) => void;
}>;

/**
 * - Purpose: compact system template catalog with insert into URL/body.
 * - Inputs: insert target, body availability, insert callback.
 * - Outputs: presentational catalog intents only.
 * @uiMeta f=F-031
 */
export function ExternalServicesSystemVariablesHelp({
  insertTarget,
  bodyInsertAvailable,
  onInsertToken,
}: ExternalServicesSystemVariablesHelpProps): JSX.Element {
  const { t } = useI18n();
  const [openGroups, setOpenGroups] = useState<string[]>(["always", "call"]);
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
      <p className={styles.systemVariablesTarget} data-testid="external-services-variables-insert-target">
        {t("settings.integrations.externalServices.variables.insertTargetLabel", {
          target: targetLabel,
        })}
      </p>
      <Accordion
        type="multiple"
        value={openGroups}
        onValueChange={setOpenGroups}
        className={styles.systemVariablesAccordion}
      >
        {EXTERNAL_SERVICE_VARIABLE_CATALOG_GROUPS.map((group) => (
          <AccordionItem value={group} key={group}>
            <AccordionTrigger>{t(EXTERNAL_SERVICES_VARIABLE_GROUP_TITLE_KEYS[group])}</AccordionTrigger>
            <AccordionContent>
              <ul className={styles.systemVariablesList}>
                {listExternalServiceVariableCatalogByGroup(group).map((entry) => {
                  const token = formatExternalServiceVariableToken(entry.name);
                  const labelKey = EXTERNAL_SERVICES_VARIABLE_LABEL_KEYS[entry.name];
                  const descriptionKey = EXTERNAL_SERVICES_VARIABLE_DESCRIPTION_KEYS[entry.name];
                  return (
                    <li
                      className={styles.systemVariablesRow}
                      key={`${group}-${entry.name}`}
                      data-testid={`external-services-variable-${entry.name}`}
                    >
                      <div className={styles.systemVariablesMeta}>
                        {labelKey !== undefined ? (
                          <span className={styles.systemVariablesTitle}>{t(labelKey)}</span>
                        ) : null}
                        <div className={styles.systemVariablesDetail}>
                          <code className={styles.systemVariablesToken}>{token}</code>
                          {descriptionKey !== undefined ? (
                            <span className={styles.systemVariablesDesc}>{t(descriptionKey)}</span>
                          ) : null}
                        </div>
                      </div>
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
