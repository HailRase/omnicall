import clsx from "clsx";
import { useEffect, useState, type ChangeEvent, type JSX } from "react";
import type { OcpIntegrationSettings } from "@application/index.js";
import type {
  OcpSettingsPanelErrorKey,
} from "../../../hooks/useOcpSettingsPanel.js";
import { useI18n } from "../../../i18n/index.js";
import { Input, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./OcpModuleSettingsCard.module.css";

export type OcpModuleSettingsCardProps = Readonly<{
  settings: OcpIntegrationSettings;
  activeLoginLabel: string | null;
  errorKey: OcpSettingsPanelErrorKey | null;
  configEditable: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onDomainChange: (domain: string) => void;
  onAutoConnectChange: (autoConnect: boolean) => void;
}>;

/**
 * - Purpose: present edit-only OCP Module configuration for the active authenticated profile.
 * - Inputs: active-profile settings + edit callbacks (no Server/Authorization ownership).
 * - Outputs: localized controls without Connect/Disconnect/login picker/API-key chrome.
 * @uiMeta f=F-028 lf=LF-086,LF-087
 */
export function OcpModuleSettingsCard({
  settings,
  activeLoginLabel,
  errorKey,
  configEditable,
  onEnabledChange,
  onDomainChange,
  onAutoConnectChange,
}: OcpModuleSettingsCardProps): JSX.Element {
  const { t } = useI18n();
  const [domainDraft, setDomainDraft] = useState(settings.domain);
  const fieldsDisabled = !configEditable;

  useEffect(() => {
    setDomainDraft(settings.domain);
  }, [settings.domain]);

  function handleDomainBlur(): void {
    const trimmed = domainDraft.trim();
    if (trimmed !== settings.domain) {
      onDomainChange(trimmed);
    }
  }

  function handleDomainChange(event: ChangeEvent<HTMLInputElement>): void {
    setDomainDraft(event.target.value);
  }

  return (
    <fieldset
      className={clsx(formStyles.sectionCard, styles.card)}
      data-testid="ocp-module-settings-card"
    >
      <legend className={formStyles.sectionTitle}>
        {t("settings.integrations.ocp.title")}
      </legend>
      <p className={formStyles.blockHint}>{t("settings.integrations.ocp.editOnly.description")}</p>

      {activeLoginLabel !== null ? (
        <div className={formStyles.settingBlock} data-testid="ocp-module-active-login">
          <p className={formStyles.fieldLabel}>{t("settings.integrations.ocp.activeProfile")}</p>
          <p className={formStyles.fieldValue}>{activeLoginLabel}</p>
        </div>
      ) : null}

      <div className={formStyles.settingsGroup}>
        <div
          className={clsx(
            formStyles.settingBlock,
            fieldsDisabled && formStyles.settingBlockDisabled,
          )}
        >
          <label className={formStyles.toggleRow} htmlFor="ocp-module-enabled">
            <span className={formStyles.toggleText}>
              <span className={formStyles.toggleLabel}>
                {t("settings.integrations.ocp.enabled")}
              </span>
            </span>
            <Switch
              id="ocp-module-enabled"
              checked={settings.enabled}
              disabled={fieldsDisabled}
              data-testid="ocp-module-enabled-toggle"
              onCheckedChange={onEnabledChange}
            />
          </label>
        </div>

        <div
          className={clsx(
            formStyles.settingBlock,
            fieldsDisabled && formStyles.settingBlockDisabled,
          )}
        >
          <label className={formStyles.toggleRow} htmlFor="ocp-module-auto-connect">
            <span className={formStyles.toggleText}>
              <span className={formStyles.toggleLabel}>
                {t("settings.integrations.ocp.autoConnect")}
              </span>
              <span className={formStyles.toggleDescription}>
                {t("settings.integrations.ocp.autoConnect.scopeHint")}
              </span>
            </span>
            <Switch
              id="ocp-module-auto-connect"
              checked={settings.autoConnect}
              disabled={fieldsDisabled || !settings.enabled}
              data-testid="ocp-module-auto-connect-toggle"
              onCheckedChange={onAutoConnectChange}
            />
          </label>
        </div>

        <div
          className={clsx(
            formStyles.settingBlock,
            fieldsDisabled && formStyles.settingBlockDisabled,
          )}
        >
          <label className={formStyles.fieldLabel} htmlFor="ocp-module-domain">
            {t("settings.integrations.ocp.domain")}
          </label>
          <Input
            id="ocp-module-domain"
            size="sm"
            value={domainDraft}
            disabled={fieldsDisabled}
            placeholder={t("settings.integrations.ocp.domain.placeholder")}
            data-testid="ocp-module-domain-input"
            onBlur={handleDomainBlur}
            onChange={handleDomainChange}
          />
        </div>
      </div>

      {/* Ephemeral save/load failures: notifications (ADR-0026). domainRequired reserved for FormField. */}
      {errorKey === "settings.integrations.ocp.error.domainRequired" ? (
        <p className={formStyles.error} data-testid="ocp-module-error" role="alert">
          {t(errorKey)}
        </p>
      ) : null}
    </fieldset>
  );
}
