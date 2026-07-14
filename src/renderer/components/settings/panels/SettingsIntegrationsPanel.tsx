import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { OcpModuleSettingsCardProps } from "./OcpModuleSettingsCard.js";
import { OcpModuleSettingsCard } from "./OcpModuleSettingsCard.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsIntegrationsPanelProps = Readonly<{
  ocp: OcpModuleSettingsCardProps;
}>;

/**
 * - Purpose: Settings → Integrations section shell (extensible card list).
 * - Inputs: OCP card props; future cards (CRM / SDK) can append here.
 * - Outputs: presentational integrations panel without facade access.
 * @uiMeta f=F-028
 */
export function SettingsIntegrationsPanel({
  ocp,
}: SettingsIntegrationsPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className={formStyles.panelStack} data-testid="settings-integrations-panel">
      <p className={formStyles.blockHint}>{t("settings.integrations.description")}</p>
      <OcpModuleSettingsCard {...ocp} />
    </div>
  );
}
