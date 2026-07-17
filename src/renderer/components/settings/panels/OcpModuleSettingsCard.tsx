import clsx from "clsx";
import { useEffect, useState, type ChangeEvent, type JSX } from "react";
import type { OcpIntegrationSettings } from "@application/index.js";
import type {
  OcpSettingsPanelErrorKey,
  UseOcpSettingsPanelResult,
} from "../../../hooks/useOcpSettingsPanel.js";
import { useI18n } from "../../../i18n/index.js";
import { Button, IconButton, Input, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./OcpModuleSettingsCard.module.css";

export type OcpModuleSettingsCardProps = Readonly<{
  settings: OcpIntegrationSettings;
  activeLoginLabel: string | null;
  apiKeyDraft: string;
  apiKeyVisible: boolean;
  hasSavedApiKey: boolean;
  actionLoading: UseOcpSettingsPanelResult["actionLoading"];
  errorKey: OcpSettingsPanelErrorKey | null;
  configEditable: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onDomainChange: (domain: string) => void;
  onAutoConnectChange: (autoConnect: boolean) => void;
  onApiKeyDraftChange: (apiKey: string) => void;
  onApiKeyVisibleChange: (visible: boolean) => void;
  onSaveApiKey: () => void;
  onDeleteApiKey: () => void;
}>;

/**
 * - Purpose: present edit-only OCP Module configuration for the active authenticated profile.
 * - Inputs: active-profile settings + edit callbacks (no Server/Authorization ownership).
 * - Outputs: localized controls without Connect/Disconnect/login picker/status chrome.
 * @uiMeta f=F-028 lf=LF-086,LF-087
 */
export function OcpModuleSettingsCard({
  settings,
  activeLoginLabel,
  apiKeyDraft,
  apiKeyVisible,
  hasSavedApiKey,
  actionLoading,
  errorKey,
  configEditable,
  onEnabledChange,
  onDomainChange,
  onAutoConnectChange,
  onApiKeyDraftChange,
  onApiKeyVisibleChange,
  onSaveApiKey,
  onDeleteApiKey,
}: OcpModuleSettingsCardProps): JSX.Element {
  const { t } = useI18n();
  const [domainDraft, setDomainDraft] = useState(settings.domain);
  const isBusy = actionLoading !== null;
  const fieldsDisabled = !configEditable || isBusy;
  const apiKeyToggleLabel = apiKeyVisible
    ? t("settings.integrations.ocp.apiKey.hide")
    : t("settings.integrations.ocp.apiKey.show");

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

        <div
          className={clsx(
            formStyles.settingBlock,
            fieldsDisabled && formStyles.settingBlockDisabled,
          )}
        >
          <label className={formStyles.fieldLabel} htmlFor="ocp-module-api-key">
            {t("settings.integrations.ocp.apiKey")}
          </label>
          <div className={styles.tokenField}>
            <Input
              id="ocp-module-api-key"
              className={styles.tokenInput}
              size="sm"
              type={apiKeyVisible ? "text" : "password"}
              value={apiKeyDraft}
              disabled={fieldsDisabled}
              data-testid="ocp-module-api-key-input"
              autoComplete="off"
              placeholder={
                hasSavedApiKey
                  ? t("settings.integrations.ocp.apiKey.savedPlaceholder")
                  : t("settings.integrations.ocp.apiKey.placeholder")
              }
              onChange={(event) => {
                onApiKeyDraftChange(event.target.value);
              }}
            />
            <IconButton
              iconId={apiKeyVisible ? "form.password.show" : "form.password.hide"}
              ariaLabel={apiKeyToggleLabel}
              data-testid="ocp-module-api-key-visibility-toggle"
              variant="ghost"
              size="sm"
              disabled={fieldsDisabled}
              onClick={() => {
                onApiKeyVisibleChange(!apiKeyVisible);
              }}
            />
          </div>
          <div className={styles.tokenActions}>
            <Button
              size="sm"
              variant="secondary"
              data-testid="ocp-module-api-key-save"
              disabled={fieldsDisabled || apiKeyDraft.trim().length === 0}
              loading={actionLoading === "save-api-key"}
              onClick={onSaveApiKey}
            >
              {t("settings.integrations.ocp.apiKey.save")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              data-testid="ocp-module-api-key-delete"
              disabled={fieldsDisabled || !hasSavedApiKey}
              loading={actionLoading === "delete-api-key"}
              onClick={onDeleteApiKey}
            >
              {t("settings.integrations.ocp.apiKey.delete")}
            </Button>
          </div>
          {hasSavedApiKey ? (
            <p className={formStyles.blockHint} data-testid="ocp-module-api-key-saved-hint">
              {t("settings.integrations.ocp.apiKey.savedHint")}
            </p>
          ) : null}
        </div>
      </div>

      {errorKey !== null ? (
        <p className={formStyles.error} data-testid="ocp-module-error" role="alert">
          {t(errorKey)}
        </p>
      ) : null}
    </fieldset>
  );
}
