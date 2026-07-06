import type { JSX, RefObject, SubmitEvent } from "react";
import clsx from "clsx";

import type { SavedProfilePanelMode } from "@application/projections/deriveSavedProfilePanelMode.js";

import type { SipAccountInput } from "@application/index.js";

import { useI18n } from "../../i18n/index.js";

import type { TranslationKey } from "../../i18n/messages.js";

import { IconTooltip } from "../icons/IconTooltip.js";

import panelStyles from "../shell/BootstrapPanel.module.css";

import formStyles from "../settings/SettingsForm.module.css";

import { Switch } from "../ui/index.js";

import styles from "./AccountPanel.module.css";



type AccountPanelProps = Readonly<{

  form: SipAccountInput;

  submitting: boolean;

  error: unknown;
  successKey: TranslationKey | null;
  warningKey: TranslationKey | null;

  disabled?: boolean;

  showTitle?: boolean;

  panelMode: SavedProfilePanelMode;

  authorizeDisabledReason: string | null;

  logoutDisabledReason: string | null;

  passwordHintKey?: TranslationKey | null;

  saveProfileVisible?: boolean;

  saveProfileChecked?: boolean;

  saveProfileDisabled?: boolean;

  saveProfileDisabledReasonKey?: TranslationKey | null;

  passwordInputRef?: RefObject<HTMLInputElement | null>;

  onFieldChange: (field: keyof SipAccountInput, value: string) => void;

  onSaveProfileChange?: (checked: boolean) => void;

  onSubmit: () => void;

  onLogout: () => void;

}>;



/**

 * - Purpose: render presentational SIP account authorization form with logout action.

 * - Inputs: form values, panel mode, disabled reasons, submit state, feedback, and callbacks.

 * - Outputs: accessible account panel without facade or Use Case calls.

 */

export function AccountPanel({

  form,

  submitting,

  disabled = false,

  showTitle = true,

  panelMode,

  authorizeDisabledReason,

  logoutDisabledReason,

  passwordHintKey = null,

  saveProfileVisible = false,

  saveProfileChecked = false,

  saveProfileDisabled = false,

  saveProfileDisabledReasonKey = null,

  passwordInputRef,

  onFieldChange,

  onSaveProfileChange,

  onSubmit,

  onLogout,

}: AccountPanelProps): JSX.Element {

  const { t } = useI18n();



  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {

    event.preventDefault();

    onSubmit();

  }



  const authorizeDisabled = disabled || submitting || authorizeDisabledReason !== null;

  const logoutDisabled = logoutDisabledReason !== null;

  const passwordOnly = panelMode === "savedPasswordOnly";

  const showFullForm = panelMode === "newFull" || panelMode === "savedFull";

  const showLogout = panelMode !== "savedPasswordOnly";

  const submitLabelKey: TranslationKey =

    passwordOnly ? "account.action.signIn" : "account.action.authorize";


  return (

    <section

      className={panelStyles.panel}

      data-testid="account-panel"

      role="tabpanel"

      aria-labelledby={

        panelMode === "newFull"

          ? "saved-profile-tab-new"

          : panelMode === "savedPasswordOnly" || panelMode === "savedFull"

            ? undefined

            : undefined

      }

    >

      {showTitle ? <h2>{t("account.title")}</h2> : null}

      <form className={styles.form} onSubmit={handleSubmit}>

        {showFullForm ? (

          <>

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

            <label className={styles.label}>

              {t("account.field.password")}

              <input

                ref={passwordInputRef}

                className={styles.input}

                type="password"

                value={form.password}

                disabled={disabled || submitting}

                data-testid="account-password"

                onChange={(event) => {

                  onFieldChange("password", event.target.value);

                }}

              />

            </label>

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

        ) : (

          <label className={styles.label}>

            {t("account.field.password")}

            <input

              ref={passwordInputRef}

              className={styles.input}

              type="password"

              value={form.password}

              disabled={disabled || submitting}

              data-testid="account-password"

              onChange={(event) => {

                onFieldChange("password", event.target.value);

              }}

            />

            {passwordHintKey !== null ? (

              <span className={styles.fieldHint} data-testid="account-password-hint">

                {t(passwordHintKey)}

              </span>

            ) : null}

          </label>

        )}

        {saveProfileVisible ? (

          <label
            className={clsx(
              formStyles.toggleRow,
              saveProfileDisabled && styles.saveProfileDisabled,
            )}
            data-testid="account-save-profile-row"
          >

            <span className={formStyles.toggleText}>

              <span className={formStyles.toggleLabel}>{t("account.profile.saveCheckbox.label")}</span>

              <span className={formStyles.toggleDescription}>

                {saveProfileDisabled && saveProfileDisabledReasonKey !== null

                  ? t(saveProfileDisabledReasonKey)

                  : t("account.profile.saveCheckbox.description")}

              </span>

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

        <div className={clsx(styles.actions, passwordOnly && styles.actionsPasswordOnly)}>

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

                aria-label={authorizeDisabledReason ?? t(submitLabelKey)}

              >

                {t(submitLabelKey)}

              </button>

            </span>

          </IconTooltip>

          {showLogout ? (

            <IconTooltip label={logoutDisabledReason ?? ""} className={styles.actionTooltipHost}>

              <span className={styles.buttonWrap}>

                <button

                  type="button"

                  className={styles.logoutAction}

                  data-testid="account-logout"

                  disabled={logoutDisabled}

                  aria-label={logoutDisabledReason ?? t("account.action.logout")}

                  onClick={onLogout}

                >

                  {t("account.action.logout")}

                </button>

              </span>

            </IconTooltip>

          ) : null}

        </div>

      </form>

    </section>

  );

}

