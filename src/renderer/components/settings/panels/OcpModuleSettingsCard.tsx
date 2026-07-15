import clsx from "clsx";
import { useEffect, useId, useState, type ChangeEvent, type JSX } from "react";
import type {
  OcpConnectLoginOption,
  OcpIntegrationSettings,
} from "@application/index.js";
import type { OcpSessionProjection } from "@application/projections/integration/ocpSessionProjection.js";
import {
  resolveOcpStatusLabelKey,
  type OcpSettingsPanelErrorKey,
  type UseOcpSettingsPanelResult,
} from "../../../hooks/useOcpSettingsPanel.js";
import { useI18n } from "../../../i18n/index.js";
import { Button, IconButton, Input, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./OcpModuleSettingsCard.module.css";

export type OcpModuleSettingsCardProps = Readonly<{
  settings: OcpIntegrationSettings;
  session: OcpSessionProjection;
  login: string;
  loginOptions: ReadonlyArray<OcpConnectLoginOption>;
  apiKeyDraft: string;
  apiKeyVisible: boolean;
  hasSavedApiKey: boolean;
  actionLoading: UseOcpSettingsPanelResult["actionLoading"];
  errorKey: OcpSettingsPanelErrorKey | null;
  onLoginChange: (login: string) => void;
  onEnabledChange: (enabled: boolean) => void;
  onDomainChange: (domain: string) => void;
  onAutoConnectChange: (autoConnect: boolean) => void;
  onApiKeyDraftChange: (apiKey: string) => void;
  onApiKeyVisibleChange: (visible: boolean) => void;
  onSaveApiKey: () => void;
  onDeleteApiKey: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}>;

const STATUS_DOT_CLASS: Record<OcpSessionProjection["connectionState"], string> = {
  disconnected: styles.statusDot,
  connecting: styles.statusDotConnecting,
  connected: styles.statusDotConnected,
  authenticated: styles.statusDotAuthenticated,
  reconnecting: styles.statusDotReconnecting,
  failed: styles.statusDotFailed,
  sessionClosed: styles.statusDotSessionClosed,
};

/**
 * - Purpose: present OCP Module configuration card inside Settings → Integrations.
 * - Inputs: login-scoped settings + session projection + connection callbacks.
 * - Outputs: localized controls without facade/SIP access.
 * @uiMeta f=F-028 lf=LF-018,LF-019
 */
export function OcpModuleSettingsCard({
  settings,
  session,
  login,
  loginOptions,
  apiKeyDraft,
  apiKeyVisible,
  hasSavedApiKey,
  actionLoading,
  errorKey,
  onLoginChange,
  onEnabledChange,
  onDomainChange,
  onAutoConnectChange,
  onApiKeyDraftChange,
  onApiKeyVisibleChange,
  onSaveApiKey,
  onDeleteApiKey,
  onConnect,
  onDisconnect,
}: OcpModuleSettingsCardProps): JSX.Element {
  const { t } = useI18n();
  const loginListId = useId();
  const [domainDraft, setDomainDraft] = useState(settings.domain);
  const hasLogin = login.trim().length > 0;
  const hasLoginSuggestions = loginOptions.length > 0;

  useEffect(() => {
    setDomainDraft(settings.domain);
  }, [settings.domain]);

  const fieldsDisabled = !settings.enabled || !hasLogin;
  const isBusy = actionLoading !== null;
  const isConnected =
    session.connectionState === "connected" ||
    session.connectionState === "authenticated" ||
    session.connectionState === "reconnecting";
  const canConnect =
    settings.enabled &&
    hasLogin &&
    !isBusy &&
    session.connectionState !== "connecting" &&
    !isConnected;
  const canDisconnect =
    settings.enabled &&
    !isBusy &&
    (isConnected || session.connectionState === "connecting");
  const statusKey = resolveOcpStatusLabelKey(settings.enabled, session.connectionState);
  const apiKeyToggleLabel = apiKeyVisible
    ? t("settings.integrations.ocp.apiKey.hide")
    : t("settings.integrations.ocp.apiKey.show");

  function handleDomainBlur(): void {
    const trimmed = domainDraft.trim();
    if (trimmed !== settings.domain) {
      onDomainChange(trimmed);
    }
  }

  function handleDomainChange(event: ChangeEvent<HTMLInputElement>): void {
    setDomainDraft(event.target.value);
  }

  function handleLoginChange(event: ChangeEvent<HTMLInputElement>): void {
    onLoginChange(event.target.value);
  }

  return (
    <fieldset
      className={clsx(formStyles.sectionCard, styles.card)}
      data-testid="ocp-module-settings-card"
    >
      <legend className={formStyles.sectionTitle}>
        {t("settings.integrations.ocp.title")}
      </legend>
      <p className={formStyles.blockHint}>{t("settings.integrations.ocp.description")}</p>

      <div className={formStyles.settingsGroup}>
        <div className={formStyles.settingBlock}>
          <label className={formStyles.toggleRow} htmlFor="ocp-module-enabled">
            <span className={formStyles.toggleText}>
              <span className={formStyles.toggleLabel}>
                {t("settings.integrations.ocp.enabled")}
              </span>
            </span>
            <Switch
              id="ocp-module-enabled"
              checked={settings.enabled}
              disabled={isBusy || !hasLogin}
              data-testid="ocp-module-enabled-toggle"
              onCheckedChange={onEnabledChange}
            />
          </label>
        </div>

        <div className={formStyles.settingBlock}>
          <label className={formStyles.fieldLabel} htmlFor="ocp-module-login">
            {t("settings.integrations.ocp.login")}
          </label>
          <Input
            id="ocp-module-login"
            size="sm"
            value={login}
            disabled={isBusy}
            list={hasLoginSuggestions ? loginListId : undefined}
            autoComplete="username"
            placeholder={t("settings.integrations.ocp.login.placeholder")}
            data-testid="ocp-module-login-input"
            aria-describedby="ocp-module-login-hint"
            onChange={handleLoginChange}
          />
          {hasLoginSuggestions ? (
            <datalist id={loginListId} data-testid="ocp-module-login-datalist">
              {loginOptions.map((option) => (
                <option
                  key={option.accountKey}
                  value={option.login}
                  label={option.displayName}
                />
              ))}
            </datalist>
          ) : null}
          <p className={formStyles.blockHint} id="ocp-module-login-hint">
            {hasLoginSuggestions
              ? t("settings.integrations.ocp.login.hintWithProfiles")
              : t("settings.integrations.ocp.login.hint")}
          </p>
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
            disabled={fieldsDisabled || isBusy}
            placeholder={t("settings.integrations.ocp.domain.placeholder")}
            data-testid="ocp-module-domain-input"
            onChange={handleDomainChange}
            onBlur={handleDomainBlur}
          />
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
            </span>
            <Switch
              id="ocp-module-auto-connect"
              checked={settings.autoConnect}
              disabled={fieldsDisabled || isBusy}
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
              disabled={fieldsDisabled || isBusy}
              autoComplete="off"
              placeholder={
                hasSavedApiKey
                  ? t("settings.integrations.ocp.apiKey.savedPlaceholder")
                  : t("settings.integrations.ocp.apiKey.placeholder")
              }
              data-testid="ocp-module-api-key-input"
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
              disabled={fieldsDisabled || isBusy}
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
              disabled={fieldsDisabled || isBusy || apiKeyDraft.trim().length === 0}
              loading={actionLoading === "save-api-key"}
              onClick={onSaveApiKey}
            >
              {t("settings.integrations.ocp.apiKey.save")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              data-testid="ocp-module-api-key-delete"
              disabled={fieldsDisabled || isBusy || !hasSavedApiKey}
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

        <div className={formStyles.settingBlock}>
          <p className={formStyles.toggleLabel}>{t("settings.integrations.ocp.status.label")}</p>
          <div className={styles.statusRow} data-testid="ocp-module-status">
            <span
              className={clsx(styles.statusDot, STATUS_DOT_CLASS[session.connectionState])}
              aria-hidden
            />
            <p className={formStyles.fieldValue}>{t(statusKey)}</p>
          </div>
          {!settings.enabled ? (
            <p className={formStyles.blockHint} data-testid="ocp-module-enable-first-hint">
              {t("settings.integrations.ocp.connectDisabled.enableFirst")}
            </p>
          ) : null}
          {settings.enabled && !hasLogin ? (
            <p className={formStyles.blockHint} data-testid="ocp-module-login-required-hint">
              {t("settings.integrations.ocp.connectDisabled.loginRequired")}
            </p>
          ) : null}
          <div className={formStyles.actionRow}>
            {canConnect ? (
              <Button
                size="sm"
                data-testid="ocp-module-connect"
                disabled={!canConnect}
                loading={actionLoading === "connect"}
                onClick={onConnect}
              >
                {t("settings.integrations.ocp.connect")}
              </Button>
            ) : null}
            {canDisconnect ? (
              <Button
                size="sm"
                variant="secondary"
                data-testid="ocp-module-disconnect"
                disabled={!canDisconnect}
                loading={actionLoading === "disconnect"}
                onClick={onDisconnect}
              >
                {t("settings.integrations.ocp.disconnect")}
              </Button>
            ) : null}
          </div>
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
