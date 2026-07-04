import type { JSX, SubmitEvent } from "react";
import type { SipAccountInput } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import { IconTooltip } from "../icons/IconTooltip.js";
import panelStyles from "../shell/BootstrapPanel.module.css";
import styles from "./AccountPanel.module.css";

type AccountPanelProps = Readonly<{
  form: SipAccountInput;
  submitting: boolean;
  error: string | null;
  disabled?: boolean;
  showTitle?: boolean;
  authorizeDisabledReason: string | null;
  logoutDisabledReason: string | null;
  onFieldChange: (field: keyof SipAccountInput, value: string) => void;
  onSubmit: () => void;
  onLogout: () => void;
}>;

/**
 * - Purpose: render presentational SIP account authorization form with logout action.
 * - Inputs: form values, disabled reasons, submit state, error, and callbacks.
 * - Outputs: accessible account panel without facade or Use Case calls.
 */
export function AccountPanel({
  form,
  submitting,
  error,
  disabled = false,
  showTitle = true,
  authorizeDisabledReason,
  logoutDisabledReason,
  onFieldChange,
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

  return (
    <section className={panelStyles["panel"]} data-testid="account-panel">
      {showTitle ? <h2>{t("account.title")}</h2> : null}
      <form className={styles["form"]} onSubmit={handleSubmit}>
        <label className={styles["label"]}>
          {t("account.field.username")}
          <input
            className={styles["input"]}
            value={form.username}
            disabled={disabled || submitting}
            onChange={(event) => {
              onFieldChange("username", event.target.value);
            }}
          />
        </label>
        <label className={styles["label"]}>
          {t("account.field.password")}
          <input
            className={styles["input"]}
            type="password"
            value={form.password}
            disabled={disabled || submitting}
            onChange={(event) => {
              onFieldChange("password", event.target.value);
            }}
          />
        </label>
        <label className={styles["label"]}>
          {t("account.field.domain")}
          <input
            className={styles["input"]}
            value={form.domain}
            disabled={disabled || submitting}
            onChange={(event) => {
              onFieldChange("domain", event.target.value);
            }}
          />
        </label>
        <label className={styles["label"]}>
          {t("account.field.server")}
          <input
            className={styles["input"]}
            value={form.server}
            disabled={disabled || submitting}
            onChange={(event) => {
              onFieldChange("server", event.target.value);
            }}
          />
        </label>
        <div className={styles["actions"]}>
          <IconTooltip
            label={authorizeDisabledReason ?? ""}
            className={styles["actionTooltipHost"]}
          >
            <span className={styles["buttonWrap"]}>
              <button
                type="submit"
                className={styles["primaryAction"]}
                data-testid="account-authorize"
                disabled={authorizeDisabled}
                aria-label={authorizeDisabledReason ?? t("account.action.authorize")}
              >
                {t("account.action.authorize")}
              </button>
            </span>
          </IconTooltip>
          <IconTooltip label={logoutDisabledReason ?? ""} className={styles["actionTooltipHost"]}>
            <span className={styles["buttonWrap"]}>
              <button
                type="button"
                className={styles["logoutAction"]}
                data-testid="account-logout"
                disabled={logoutDisabled}
                aria-label={logoutDisabledReason ?? t("account.action.logout")}
                onClick={onLogout}
              >
                {t("account.action.logout")}
              </button>
            </span>
          </IconTooltip>
        </div>
      </form>
      {error !== null && (
        <p className={styles["error"]} role="alert" data-testid="account-error">
          {error}
        </p>
      )}
    </section>
  );
}
