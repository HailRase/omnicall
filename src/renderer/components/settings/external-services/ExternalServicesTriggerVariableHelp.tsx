/**
 * - Purpose: ? help listing system variable groups available for one automatic trigger.
 * - Inputs: automatic event type and localized event label.
 * - Outputs: presentational help control; groups from Domain SSoT (same as Variables tab).
 */

import {
  formatExternalServiceVariableToken,
  listExternalServiceVariableCatalogByGroup,
  resolveExternalServiceEventVariableGroups,
} from "@application/index.js";
import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import {
  EXTERNAL_SERVICES_VARIABLE_GROUP_TITLE_KEYS,
  EXTERNAL_SERVICES_VARIABLE_GROUP_WHEN_KEYS,
} from "./externalServicesVariableI18nKeys.js";
import type { ExternalServicesAutomaticEventType } from "./externalServicesAutomaticEventType.js";
import { ExternalServicesVariableHelpButton } from "./ExternalServicesVariableHelpButton.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesTriggerVariableHelpProps = Readonly<{
  eventType: ExternalServicesAutomaticEventType;
  eventLabel: string;
}>;

/**
 * @uiMeta f=F-031
 */
export function ExternalServicesTriggerVariableHelp({
  eventType,
  eventLabel,
}: ExternalServicesTriggerVariableHelpProps): JSX.Element {
  const { t } = useI18n();
  const groups = resolveExternalServiceEventVariableGroups(eventType);

  return (
    <ExternalServicesVariableHelpButton
      variableLabel={eventLabel}
      testId={`external-services-trigger-help-${eventType}`}
      popupClassName={styles.triggerHelpPopup}
      ariaLabel={t("settings.integrations.externalServices.trigger.helpAria", {
        name: eventLabel,
      })}
    >
      <div className={styles.triggerHelpBody}>
        <p className={styles.triggerHelpIntro}>
          {t("settings.integrations.externalServices.trigger.help.intro")}
        </p>
        {groups.map((group) => (
          <div className={styles.triggerHelpGroup} key={group}>
            <p className={styles.triggerHelpGroupTitle}>
              {t(EXTERNAL_SERVICES_VARIABLE_GROUP_TITLE_KEYS[group])}
              <span className={styles.triggerHelpGroupWhen}>
                {" · "}
                {t(EXTERNAL_SERVICES_VARIABLE_GROUP_WHEN_KEYS[group])}
              </span>
            </p>
            <ul className={styles.triggerHelpTokens}>
              {listExternalServiceVariableCatalogByGroup(group).map((entry) => (
                <li key={`${group}-${entry.name}`}>
                  <code>{formatExternalServiceVariableToken(entry.name)}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className={styles.triggerHelpFooter}>
          {t("settings.integrations.externalServices.trigger.help.authored")}
        </p>
        <p className={styles.triggerHelpFooter}>
          {t("settings.integrations.externalServices.variables.contextHint")}
        </p>
      </div>
    </ExternalServicesVariableHelpButton>
  );
}
