import clsx from "clsx";
import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";
import { SdkModuleSettingsClientsSection } from "./SdkModuleSettingsClientsSection.js";
import { SdkModuleSettingsPolicySection } from "./SdkModuleSettingsPolicySection.js";
import type { SdkModuleSettingsCardProps } from "./sdkModuleSettingsCardTypes.js";

export type { SdkModuleSettingsCardProps } from "./sdkModuleSettingsCardTypes.js";

/**
 * - Purpose: present Axatalk SDK operational controls (DI-09/DI-11); no secrets in DOM.
 * @uiMeta f=F-011 lf=LF-051,LF-065
 */
export function SdkModuleSettingsCard(props: SdkModuleSettingsCardProps): JSX.Element {
  const { t } = useI18n();

  return (
    <fieldset
      className={clsx(formStyles.sectionCard, styles.card)}
      data-testid="sdk-module-settings-card"
    >
      <legend className={formStyles.sectionTitle}>
        {t("settings.integrations.sdk.title")}
      </legend>
      <p className={formStyles.blockHint}>{t("settings.integrations.sdk.description")}</p>

      <div className={formStyles.settingsGroup}>
        <SdkModuleSettingsPolicySection
          settings={props.settings}
          diagnostics={props.diagnostics}
          allowedOriginsLive={props.allowedOriginsLive}
          pendingOriginTrust={props.pendingOriginTrust}
          originsDraft={props.originsDraft}
          busy={props.busy}
          onOriginsDraftChange={props.onOriginsDraftChange}
          onOriginsSave={props.onOriginsSave}
          onRefresh={props.onRefresh}
          onAllowOriginTrust={props.onAllowOriginTrust}
          onDenyOriginTrust={props.onDenyOriginTrust}
          onUnblockOrigin={props.onUnblockOrigin}
          onSetOriginMatrix={props.onSetOriginMatrix}
        />
        <SdkModuleSettingsClientsSection
          diagnostics={props.diagnostics}
          pairedClients={props.pairedClients}
          pendingPairing={props.pendingPairing}
          profileOptions={props.profileOptions}
          selectedClientId={props.selectedClientId}
          selectedProfileId={props.selectedProfileId}
          lastGrant={props.lastGrant}
          busy={props.busy}
          onApprovePairing={props.onApprovePairing}
          onDenyPairing={props.onDenyPairing}
          onRevokeClient={props.onRevokeClient}
          onSelectClientId={props.onSelectClientId}
          onSelectProfileId={props.onSelectProfileId}
          onIssueActivateGrant={props.onIssueActivateGrant}
        />
      </div>

      {props.errorKey !== null ? (
        <p className={formStyles.error} data-testid="sdk-module-error" role="alert">
          {t(props.errorKey)}
        </p>
      ) : null}
    </fieldset>
  );
}
