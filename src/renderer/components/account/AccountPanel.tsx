import type { JSX, SubmitEvent } from "react";
import type { SipAccountInput } from "@application/index.js";
import panelStyles from "../shell/BootstrapPanel.module.css";
import styles from "./AccountPanel.module.css";

type AccountPanelProps = Readonly<{
  form: SipAccountInput;
  submitting: boolean;
  error: string | null;
  disabled?: boolean;
  showTitle?: boolean;
  onFieldChange: (field: keyof SipAccountInput, value: string) => void;
  onSubmit: () => void;
}>;

/**
 * - Purpose: render presentational SIP account authorization form.
 * - Inputs: form values, submit state, error, and field/submit callbacks.
 * - Outputs: accessible account panel without facade or Use Case calls.
 */
export function AccountPanel({
  form,
  submitting,
  error,
  disabled = false,
  showTitle = true,
  onFieldChange,
  onSubmit,
}: AccountPanelProps): JSX.Element {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

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
        <button type="submit" disabled={disabled || submitting}>
          Авторизоваться и зарегистрироваться
        </button>
      </form>
      {error !== null && (
        <p className={styles["error"]} role="alert" data-testid="account-error">
          {error}
        </p>
      )}
    </section>
  );
}
