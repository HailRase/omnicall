import clsx from "clsx";
import { useEffect, useState, type ChangeEvent, type JSX } from "react";
import type { OcpIntegrationSettings } from "@application/index.js";
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
  tokenDraft: string;
  tokenVisible: boolean;
  hasSavedToken: boolean;
  actionLoading: UseOcpSettingsPanelResult["actionLoading"];
  errorKey: OcpSettingsPanelErrorKey | null;
  onEnabledChange: (enabled: boolean) => void;
  onDomainChange: (domain: string) => void;
  onAutoConnectChange: (autoConnect: boolean) => void;
  onAutoSipAuthChange: (autoSipAuth: boolean) => void;
  onTokenDraftChange: (token: string) => void;
  onTokenVisibleChange: (visible: boolean) => void;
  onSaveToken: () => void;
  onDeleteToken: () => void;
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
 * - Inputs: settings + session projection + token/connection callbacks.
 * - Outputs: localized controls without facade/SIP access.
 * @uiMeta f=F-028 lf=LF-018,LF-019
 */
export function OcpModuleSettingsCard({
  settings,
  session,
  tokenDraft,
  tokenVisible,
  hasSavedToken,
  actionLoading,
  errorKey,
  onEnabledChange,
  onDomainChange,
  onAutoConnectChange,
  onAutoSipAuthChange,
  onTokenDraftChange,
  onTokenVisibleChange,
  onSaveToken,
  onDeleteToken,
  onConnect,
  onDisconnect,
}: OcpModuleSettingsCardProps): JSX.Element {
  const { t } = useI18n();
  const [domainDraft, setDomainDraft] = useState(settings.domain);

  useEffect(() => {
    setDomainDraft(settings.domain);
  }, [settings.domain]);

  const fieldsDisabled = !settings.enabled;
  const isBusy = actionLoading !== null;
  const isConnected =
    session.connectionState === "connected" ||
    session.connectionState === "authenticated" ||
    session.connectionState === "reconnecting";
  const canConnect =
    settings.enabled &&
    !isBusy &&
    session.connectionState !== "connecting" &&
    !isConnected;
  const canDisconnect =
    settings.enabled &&
    !isBusy &&
    (isConnected || session.connectionState === "connecting");
  const statusKey = resolveOcpStatusLabelKey(settings.enabled, session.connectionState);
  const tokenToggleLabel = tokenVisible
    ? t("settings.integrations.ocp.token.hide")
    : t("settings.integrations.ocp.token.show");

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
              disabled={isBusy}
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
          <label className={formStyles.toggleRow} htmlFor="ocp-module-auto-sip-auth">
            <span className={formStyles.toggleText}>
              <span className={formStyles.toggleLabel}>
                {t("settings.integrations.ocp.autoSipAuth")}
              </span>
            </span>
            <Switch
              id="ocp-module-auto-sip-auth"
              checked={settings.autoSipAuth}
              disabled={fieldsDisabled || isBusy}
              data-testid="ocp-module-auto-sip-auth-toggle"
              onCheckedChange={onAutoSipAuthChange}
            />
          </label>
        </div>

        <div
          className={clsx(
            formStyles.settingBlock,
            fieldsDisabled && formStyles.settingBlockDisabled,
          )}
        >
          <label className={formStyles.fieldLabel} htmlFor="ocp-module-token">
            {t("settings.integrations.ocp.token")}
          </label>
          <div className={styles.tokenField}>
            <Input
              id="ocp-module-token"
              className={styles.tokenInput}
              size="sm"
              type={tokenVisible ? "text" : "password"}
              value={tokenDraft}
              disabled={fieldsDisabled || isBusy}
              autoComplete="off"
              placeholder={
                hasSavedToken
                  ? t("settings.integrations.ocp.token.savedPlaceholder")
                  : t("settings.integrations.ocp.token.placeholder")
              }
              data-testid="ocp-module-token-input"
              onChange={(event) => {
                onTokenDraftChange(event.target.value);
              }}
            />
            <IconButton
              iconId={tokenVisible ? "form.password.show" : "form.password.hide"}
              ariaLabel={tokenToggleLabel}
              data-testid="ocp-module-token-visibility-toggle"
              variant="ghost"
              size="sm"
              disabled={fieldsDisabled || isBusy}
              onClick={() => {
                onTokenVisibleChange(!tokenVisible);
              }}
            />
          </div>
          <div className={styles.tokenActions}>
            <Button
              size="sm"
              variant="secondary"
              data-testid="ocp-module-token-save"
              disabled={fieldsDisabled || isBusy || tokenDraft.trim().length === 0}
              loading={actionLoading === "save-token"}
              onClick={onSaveToken}
            >
              {t("settings.integrations.ocp.token.save")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              data-testid="ocp-module-token-delete"
              disabled={fieldsDisabled || isBusy || !hasSavedToken}
              loading={actionLoading === "delete-token"}
              onClick={onDeleteToken}
            >
              {t("settings.integrations.ocp.token.delete")}
            </Button>
          </div>
          {hasSavedToken ? (
            <p className={formStyles.blockHint} data-testid="ocp-module-token-saved-hint">
              {t("settings.integrations.ocp.token.savedHint")}
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
