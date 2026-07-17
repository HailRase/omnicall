import { type JSX, type RefObject, type SubmitEvent } from "react";
import clsx from "clsx";
import type { SavedProfilePanelMode } from "@application/projections/settings/deriveSavedProfilePanelMode.js";
import type {
  OcpRecoveryAction,
  SipAccountInput,
} from "@application/index.js";
import type { AuthorizationProgressProjection } from "@application/projections/settings/authorizationProgressProjection.js";
import type { AccountAuthorizationErrorProjection } from "@application/projections/settings/mapAccountAuthorizationError.js";
import { useI18n } from "../../i18n/index.js";
import type { TranslationKey } from "../../i18n/messages.js";
import type { AccountUiSignInMode, OcpDraftFields } from "../../hooks/accountActionsHelpers.js";
import {
  recoveryActionLabelKey,
  recoveryActionTestId,
} from "../../hooks/accountActionsHelpers.js";
import { IconTooltip } from "../icons/IconTooltip.js";
import { AccountPasswordField } from "./AccountPasswordField.js";
import { OcpSignInProgress } from "./OcpSignInProgress.js";
import panelStyles from "../shell/BootstrapPanel.module.css";
import formStyles from "../settings/SettingsForm.module.css";
import {
  Button,
  Alert,
  AlertDescription,
  InputGroup,
  InputGroupInput,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "../ui/index.js";
import styles from "./AccountPanel.module.css";

type AccountPanelProps = Readonly<{
  form: SipAccountInput;
  ocpDraft: OcpDraftFields;
  signInMode: AccountUiSignInMode;
  submitting: boolean;
  error: AccountAuthorizationErrorProjection | null;
  successKey: TranslationKey | null;
  warningKey: TranslationKey | null;
  disabled?: boolean;
  showTitle?: boolean;
  panelMode: SavedProfilePanelMode;
  authorizeDisabledReason: string | null;
  passwordHintKey?: TranslationKey | null;
  passwordFieldVisible?: boolean;
  saveProfileVisible?: boolean;
  saveProfileChecked?: boolean;
  saveProfileDisabled?: boolean;
  saveProfileDisabledReasonKey?: TranslationKey | null;
  rememberPasswordVisible?: boolean;
  rememberPasswordChecked?: boolean;
  rememberPasswordDisabled?: boolean;
  showOcpDomainField?: boolean;
  showOcpApiKeyField?: boolean;
  showOcpLoginField?: boolean;
  hasSavedOcpApiKey?: boolean;
  allowedRecoveryActions?: ReadonlyArray<OcpRecoveryAction>;
  onRecoveryAction?: (action: OcpRecoveryAction) => void;
  authorizationProgress?: AuthorizationProgressProjection;
  canForgetSavedSipPassword?: boolean;
  passwordInputRef?: RefObject<HTMLInputElement | null>;
  onFieldChange: (field: keyof SipAccountInput, value: string) => void;
  onOcpFieldChange: (field: keyof OcpDraftFields, value: string) => void;
  onSignInModeChange: (mode: AccountUiSignInMode) => void;
  onSaveProfileChange?: (checked: boolean) => void;
  onRememberPasswordChange?: (checked: boolean) => void;
  onSubmit: () => void;
  onForgetSavedSipPassword?: () => void;
}>;

/**
 * - Purpose: presentational Account sign-in form with SIP/OCP modes (WU-04 / T-034).
 * - Inputs: form values, mode, OCP draft, in-progress recovery actions, disabled reasons, callbacks.
 * - Outputs: accessible account panel; persistent Server/Authorization chrome lives in System State.
 */
export function AccountPanel({
  form,
  ocpDraft,
  signInMode,
  submitting,
  error,
  disabled = false,
  showTitle = true,
  panelMode,
  authorizeDisabledReason,
  passwordHintKey = null,
  passwordFieldVisible = true,
  saveProfileVisible = false,
  saveProfileChecked = false,
  saveProfileDisabled = false,
  saveProfileDisabledReasonKey = null,
  rememberPasswordVisible = false,
  rememberPasswordChecked = false,
  rememberPasswordDisabled = false,
  showOcpDomainField = true,
  showOcpApiKeyField = true,
  showOcpLoginField = true,
  hasSavedOcpApiKey = false,
  allowedRecoveryActions = [],
  onRecoveryAction,
  authorizationProgress,
  canForgetSavedSipPassword = false,
  passwordInputRef,
  onFieldChange,
  onOcpFieldChange,
  onSignInModeChange,
  onSaveProfileChange,
  onRememberPasswordChange,
  onSubmit,
  onForgetSavedSipPassword,
}: AccountPanelProps): JSX.Element {
  const { t } = useI18n();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  const authorizeDisabled = disabled || submitting || authorizeDisabledReason !== null;
  const showFullSipForm = true;
  const visibleRecoveryActions =
    signInMode === "ocp"
      ? allowedRecoveryActions.filter((action) => action !== "retry_server")
      : [];
  const showOcpRecovery = visibleRecoveryActions.length > 0;

  return (
    <section
      className={panelStyles.panel}
      data-testid="account-panel"
      role="tabpanel"
      aria-labelledby={panelMode === "newFull" ? "saved-profile-tab-new" : undefined}
    >
      {showTitle ? <h2>{t("account.title")}</h2> : null}

      <Tabs
        value={signInMode}
        onValueChange={(value) => {
          if (value === "sip_only" || value === "ocp") {
            onSignInModeChange(value);
          }
        }}
      >
        <TabsList
          className={styles.modeTabs}
          indicator="slide"
          data-testid="account-mode-tabs"
          aria-label={t("account.mode.tabsAria")}
        >
          <TabsTrigger
            className={styles.modeTabTrigger}
            value="sip_only"
            data-testid="account-mode-sip"
            disabled={disabled || submitting}
          >
            {t("account.mode.sipOnly")}
          </TabsTrigger>
          <TabsTrigger
            className={styles.modeTabTrigger}
            value="ocp"
            data-testid="account-mode-ocp"
            disabled={disabled || submitting}
          >
            {t("account.mode.ocpModule")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error !== null ? (
          <Alert variant="destructive" role="alert" data-testid="account-error">
            <AlertDescription>
              {error.params === undefined
                ? t(error.key)
                : t(error.key).replace("{detail}", error.params.detail)}
            </AlertDescription>
          </Alert>
        ) : null}
        {signInMode === "sip_only" ? (
          showFullSipForm ? (
            <>
              {panelMode === "newFull" ? (
                <label className={styles.label}>
                  {t("account.field.username")}
                  <input
                    className={styles.input}
                    value={form.username}
                    disabled={disabled || submitting}
                    data-testid="account-username"
                    onChange={(event) => {
                      onFieldChange("username", event.target.value);
                    }}
                  />
                </label>
              ) : null}
              <label className={styles.label}>
                {t("account.field.password")}
                <AccountPasswordField
                  value={form.password}
                  disabled={disabled || submitting}
                  inputRef={passwordInputRef}
                  onChange={(nextValue) => {
                    onFieldChange("password", nextValue);
                  }}
                />
              </label>
              {panelMode !== "newFull" && canForgetSavedSipPassword ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  data-testid="account-forget-saved-password"
                  disabled={disabled || submitting}
                  onClick={onForgetSavedSipPassword}
                >
                  {t("account.profile.rememberPassword.forget")}
                </Button>
              ) : null}
              <label className={styles.label}>
                {t("account.field.domain")}
                <input
                  className={styles.input}
                  value={form.domain}
                  disabled={disabled || submitting}
                  data-testid="account-domain"
                  onChange={(event) => {
                    onFieldChange("domain", event.target.value);
                  }}
                />
              </label>
              <label className={styles.label}>
                {t("account.field.server")}
                <input
                  className={styles.input}
                  value={form.server}
                  disabled={disabled || submitting}
                  data-testid="account-server"
                  onChange={(event) => {
                    onFieldChange("server", event.target.value);
                  }}
                />
              </label>
            </>
          ) : passwordFieldVisible ? (
            <label className={styles.label}>
              {t("account.field.password")}
              <AccountPasswordField
                value={form.password}
                disabled={disabled || submitting}
                inputRef={passwordInputRef}
                onChange={(nextValue) => {
                  onFieldChange("password", nextValue);
                }}
              />
              {passwordHintKey !== null ? (
                <span className={styles.fieldHint} data-testid="account-password-hint">
                  {t(passwordHintKey)}
                </span>
              ) : null}
            </label>
          ) : null
        ) : (
          <>
            {showOcpLoginField ? (
            <label className={styles.label}>
              {t("settings.integrations.ocp.login")}
              <InputGroup data-testid="account-ocp-login">
                <InputGroupInput
                  value={ocpDraft.login}
                  disabled={disabled || submitting}
                  placeholder={t("settings.integrations.ocp.login.placeholder")}
                  aria-label={t("settings.integrations.ocp.login")}
                  onChange={(event) => {
                    onOcpFieldChange("login", event.target.value);
                  }}
                />
              </InputGroup>
            </label>
            ) : null}

            {showOcpDomainField ? (
              <label className={styles.label}>
                {t("settings.integrations.ocp.domain")}
                <InputGroup data-testid="account-ocp-domain">
                  <InputGroupInput
                    value={ocpDraft.domain}
                    disabled={disabled || submitting}
                    placeholder={t("settings.integrations.ocp.domain.placeholder")}
                    aria-label={t("settings.integrations.ocp.domain")}
                    onChange={(event) => {
                      onOcpFieldChange("domain", event.target.value);
                    }}
                  />
                </InputGroup>
              </label>
            ) : null}

            {showOcpApiKeyField ? (
              <label className={styles.label}>
                {t("settings.integrations.ocp.apiKey")}
                <AccountPasswordField
                  value={ocpDraft.apiKey}
                  disabled={disabled || submitting}
                  autoComplete="off"
                  placeholder={
                    hasSavedOcpApiKey
                      ? t("settings.integrations.ocp.apiKey.savedPlaceholder")
                      : t("settings.integrations.ocp.apiKey.placeholder")
                  }
                  aria-label={t("settings.integrations.ocp.apiKey")}
                  inputTestId="account-ocp-api-key"
                  toggleTestId="account-ocp-api-key-visibility-toggle"
                  showAriaLabel={t("settings.integrations.ocp.apiKey.show")}
                  hideAriaLabel={t("settings.integrations.ocp.apiKey.hide")}
                  onChange={(nextValue) => {
                    onOcpFieldChange("apiKey", nextValue);
                  }}
                />
                {hasSavedOcpApiKey ? (
                  <span className={styles.fieldHint}>
                    {t("settings.integrations.ocp.apiKey.savedHint")}
                  </span>
                ) : null}
              </label>
            ) : null}
          </>
        )}

        {signInMode === "ocp" && authorizationProgress !== undefined ? (
          <OcpSignInProgress
            progress={authorizationProgress}
            onRestart={() => {
              onRecoveryAction?.("retry_server");
            }}
          />
        ) : null}

        {saveProfileVisible ? (
          <label
            className={clsx(
              formStyles.toggleRow,
              saveProfileDisabled && styles.saveProfileDisabled,
            )}
            data-testid="account-save-profile-row"
          >
            <span className={formStyles.toggleText}>
              <span className={formStyles.toggleLabel}>
                {t("account.profile.saveCheckbox.label")}
              </span>
              {saveProfileDisabled && saveProfileDisabledReasonKey !== null ? (
                <span className={formStyles.toggleDescription}>
                  {t(saveProfileDisabledReasonKey)}
                </span>
              ) : null}
            </span>
            <Switch
              id="account-save-profile"
              checked={saveProfileChecked}
              disabled={disabled || submitting || saveProfileDisabled}
              data-testid="account-save-profile-checkbox"
              onCheckedChange={(checked) => {
                onSaveProfileChange?.(checked);
              }}
            />
          </label>
        ) : null}

        {rememberPasswordVisible ? (
          <label
            className={clsx(
              formStyles.toggleRow,
              rememberPasswordDisabled && styles.saveProfileDisabled,
            )}
            data-testid="account-remember-password-row"
          >
            <span className={formStyles.toggleText}>
              <span className={formStyles.toggleLabel}>
                {t("account.profile.rememberPassword.label")}
              </span>
            </span>
            <Switch
              id="account-remember-password"
              checked={rememberPasswordChecked}
              disabled={disabled || submitting || rememberPasswordDisabled}
              data-testid="account-remember-password-checkbox"
              aria-label={t("account.profile.rememberPassword.ariaLabel")}
              onCheckedChange={(checked) => {
                onRememberPasswordChange?.(checked);
              }}
            />
          </label>
        ) : null}

        {showOcpRecovery ? (
          <div className={styles.recoveryActions} data-testid="account-recovery-actions">
            {visibleRecoveryActions.map((action) => (
              <button
                key={action}
                type="button"
                className={styles.retryAction}
                data-testid={recoveryActionTestId(action)}
                disabled={disabled || submitting}
                aria-label={t(recoveryActionLabelKey(action))}
                onClick={() => {
                  onRecoveryAction?.(action);
                }}
              >
                {t(recoveryActionLabelKey(action))}
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.actions}>
          <IconTooltip
            label={authorizeDisabledReason ?? ""}
            className={styles.actionTooltipHost}
          >
            <span className={styles.buttonWrap}>
              <button
                type="submit"
                className={styles.primaryAction}
                data-testid="account-authorize"
                disabled={authorizeDisabled}
                aria-label={authorizeDisabledReason ?? t("account.action.signIn")}
              >
                {t("account.action.signIn")}
              </button>
            </span>
          </IconTooltip>
        </div>
      </form>
    </section>
  );
}
