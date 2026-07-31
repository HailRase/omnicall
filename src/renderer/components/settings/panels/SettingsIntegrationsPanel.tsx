import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { OcpModuleSettingsCardProps } from "./OcpModuleSettingsCard.js";
import { OcpModuleSettingsCard } from "./OcpModuleSettingsCard.js";
import type { SdkModuleSettingsCardProps } from "./SdkModuleSettingsCard.js";
import { SdkModuleSettingsCard } from "./SdkModuleSettingsCard.js";
import type { ExternalServicesPanelProps } from "../external-services/ExternalServicesPanel.js";
import { ExternalServicesPanel } from "../external-services/ExternalServicesPanel.js";
import type { ExternalApplicationsPanelProps } from "../external-applications/ExternalApplicationsPanel.js";
import { ExternalApplicationsPanel } from "../external-applications/ExternalApplicationsPanel.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsIntegrationsPanelProps = Readonly<{
  sectionId?:
    | "integrations"
    | "integrations-external-services"
    | "integrations-external-applications"
    | "integrations-sdk";
  ocp: OcpModuleSettingsCardProps;
  sdk: SdkModuleSettingsCardProps;
  externalServices: ExternalServicesPanelProps;
  externalApplications: ExternalApplicationsPanelProps;
}>;

/**
 * - Purpose: Settings → Integrations section shell (OCP, external tools, SDK).
 * - Inputs: presentational card/panel props for each Integrations leaf.
 * - Outputs: section content without Domain or raw IPC access in this shell.
 * @uiMeta f=F-028,F-011,F-031
 */
export function SettingsIntegrationsPanel({
  sectionId = "integrations",
  ocp,
  sdk,
  externalServices,
  externalApplications,
}: SettingsIntegrationsPanelProps): JSX.Element {
  const { t } = useI18n();
  const isExternalServices = sectionId === "integrations-external-services";
  const isExternalApplications = sectionId === "integrations-external-applications";

  return (
    <div
      className={
        isExternalServices || isExternalApplications
          ? formStyles.panelStackFull
          : formStyles.panelStack
      }
      data-testid="settings-integrations-panel"
    >
      {sectionId === "integrations" ? (
        <>
          <p className={formStyles.blockHint}>{t("settings.integrations.description")}</p>
          <OcpModuleSettingsCard {...ocp} />
        </>
      ) : null}
      {isExternalServices ? <ExternalServicesPanel {...externalServices} /> : null}
      {isExternalApplications ? <ExternalApplicationsPanel {...externalApplications} /> : null}
      {sectionId === "integrations-sdk" ? <SdkModuleSettingsCard {...sdk} /> : null}
    </div>
  );
}
