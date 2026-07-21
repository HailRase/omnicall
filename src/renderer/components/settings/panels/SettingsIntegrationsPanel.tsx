import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { OcpModuleSettingsCardProps } from "./OcpModuleSettingsCard.js";
import { OcpModuleSettingsCard } from "./OcpModuleSettingsCard.js";
import type { SdkModuleSettingsCardProps } from "./SdkModuleSettingsCard.js";
import { SdkModuleSettingsCard } from "./SdkModuleSettingsCard.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsIntegrationsPanelProps = Readonly<{
  sectionId?: "integrations" | "integrations-sdk";
  ocp: OcpModuleSettingsCardProps;
  sdk: SdkModuleSettingsCardProps;
}>;

/**
 * - Purpose: Settings → Integrations section shell (OCP + SDK Server cards).
 * - Inputs: presentational card props; no facade / Electron access.
 * @uiMeta f=F-028,F-011
 */
export function SettingsIntegrationsPanel({
  sectionId = "integrations",
  ocp,
  sdk,
}: SettingsIntegrationsPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className={formStyles.panelStack} data-testid="settings-integrations-panel">
      <p className={formStyles.blockHint}>{t("settings.integrations.description")}</p>
      {sectionId === "integrations" ? <OcpModuleSettingsCard {...ocp} /> : null}
      {sectionId === "integrations-sdk" ? <SdkModuleSettingsCard {...sdk} /> : null}
    </div>
  );
}
