import type { JSX, SubmitEvent } from "react";
import type { SipAccountInput } from "@application/index.js";
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
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  const authorizeDisabled = disabled || submitting || authorizeDisabledReason !== null;
  const logoutDisabled = logoutDisabledReason !== null;

  return (
    <section className={panelStyles["panel"]} data-testid="account-panel">
      {showTitle ? <h2>SIP-аккаунт</h2> : null}
      <form className={styles["form"]} onSubmit={handleSubmit}>
        <label className={styles["label"]}>
          Имя пользователя
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
          Пароль
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
          Домен
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
          Сервер
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
          <IconTooltip label={authorizeDisabledReason ?? ""}>
            <span className={styles["buttonWrap"]}>
              <button
                type="submit"
                className={styles["primaryAction"]}
                data-testid="account-authorize"
                disabled={authorizeDisabled}
                aria-label={authorizeDisabledReason ?? "Авторизоваться"}
              >
                Авторизоваться
              </button>
            </span>
          </IconTooltip>
          <IconTooltip label={logoutDisabledReason ?? ""}>
            <span className={styles["buttonWrap"]}>
              <button
                type="button"
                className={styles["dangerAction"]}
                data-testid="account-logout"
                disabled={logoutDisabled}
                aria-label={logoutDisabledReason ?? "Выйти"}
                onClick={onLogout}
              >
                Выйти
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
