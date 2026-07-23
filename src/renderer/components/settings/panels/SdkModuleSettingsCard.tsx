import clsx from "clsx";
import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";
import { SdkModuleSettingsBlockedSitesSection } from "./SdkModuleSettingsBlockedSitesSection.js";
import { SdkModuleSettingsClientsSection } from "./SdkModuleSettingsClientsSection.js";
import { SdkModuleSettingsStatusSection } from "./SdkModuleSettingsStatusSection.js";
import { SdkModuleSettingsTimeoutsSection } from "./SdkModuleSettingsTimeoutsSection.js";
import { SdkModuleSettingsTrustedSitesSection } from "./SdkModuleSettingsTrustedSitesSection.js";
import type { SdkModuleSettingsCardProps } from "./sdkModuleSettingsCardTypes.js";

export type { SdkModuleSettingsCardProps } from "./sdkModuleSettingsCardTypes.js";

type SdkSettingsTab = "main" | "trusted" | "blocked";

/**
 * - Purpose: present Axatalk SDK operational controls (DI-09/DI-11); no secrets in DOM.
 *   Origin TOFU / pairing ceremony lives in root SdkConnectCeremonyModal.
 * @uiMeta f=F-011 lf=LF-051,LF-065
 */
export function SdkModuleSettingsCard(props: SdkModuleSettingsCardProps): JSX.Element {
  const { t } = useI18n();
  const blockedEntries = props.settings.origins.filter((entry) => entry.state === "denied");

  return (
    <fieldset
      className={clsx(formStyles.sectionCard, formStyles.contentColumn, styles.card)}
      data-testid="sdk-module-settings-card"
      aria-label={t("settings.integrations.sdk.title")}
    >
      <Tabs defaultValue={"main" satisfies SdkSettingsTab}>
        <TabsList
          className={styles.sectionTabs}
          indicator="slide"
          data-testid="sdk-module-section-tabs"
          aria-label={t("settings.integrations.sdk.section.tabsAria")}
        >
          <TabsTrigger
            className={styles.sectionTabTrigger}
            value="main"
            data-testid="sdk-module-tab-main"
          >
            {t("settings.integrations.sdk.section.main")}
          </TabsTrigger>
          <TabsTrigger
            className={styles.sectionTabTrigger}
            value="trusted"
            data-testid="sdk-module-tab-trusted"
          >
            {t("settings.integrations.sdk.section.trusted")}
          </TabsTrigger>
          <TabsTrigger
            className={styles.sectionTabTrigger}
            value="blocked"
            data-testid="sdk-module-tab-blocked"
          >
            {t("settings.integrations.sdk.section.blocked")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className={styles.tabPanel}>
          <div className={formStyles.settingsGroup}>
            <SdkModuleSettingsStatusSection
              diagnostics={props.diagnostics}
              busy={props.busy}
              onRefresh={props.onRefresh}
            />
            <SdkModuleSettingsTimeoutsSection
              timeouts={props.settings.operatorModalTimeouts}
              busy={props.busy}
              onChange={props.onOperatorModalTimeoutsChange}
            />
            <SdkModuleSettingsClientsSection
              pairedClients={props.pairedClients}
              busy={props.busy}
              onRevokeClient={props.onRevokeClient}
            />
          </div>
        </TabsContent>

        <TabsContent value="trusted" className={styles.tabPanel}>
          <div className={formStyles.settingsGroup}>
            <SdkModuleSettingsTrustedSitesSection
              settings={props.settings}
              addOriginDraft={props.addOriginDraft}
              busy={props.busy}
              onAddOrigin={props.onAddOrigin}
              onBlacklistOrigin={props.onBlacklistOrigin}
              onRemoveAllowedOrigin={props.onRemoveAllowedOrigin}
              onRenameAllowedOrigin={props.onRenameAllowedOrigin}
              onSetOriginMatrix={props.onSetOriginMatrix}
            />
          </div>
        </TabsContent>

        <TabsContent value="blocked" className={styles.tabPanel}>
          <div className={formStyles.settingsGroup}>
            <SdkModuleSettingsBlockedSitesSection
              entries={blockedEntries}
              busy={props.busy}
              onUnblockOrigin={props.onUnblockOrigin}
            />
          </div>
        </TabsContent>
      </Tabs>

      {props.errorKey !== null ? (
        <p className={formStyles.error} data-testid="sdk-module-error" role="alert">
          {t(props.errorKey)}
        </p>
      ) : null}
    </fieldset>
  );
}
