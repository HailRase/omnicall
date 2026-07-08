import { useState, type JSX, type RefObject } from "react";
import clsx from "clsx";

import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/AppIcon.js";

import styles from "./AccountPanel.module.css";

type AccountPasswordFieldProps = Readonly<{
  value: string;
  disabled: boolean;
  inputRef?: RefObject<HTMLInputElement | null> | undefined;
  onChange: (value: string) => void;
}>;

/**
 * - Purpose: render SIP account password input with visibility toggle.
 * - Inputs: password value, disabled state, optional input ref, change callback.
 * - Outputs: accessible password field without business logic.
 */
export function AccountPasswordField({
  value,
  disabled,
  inputRef,
  onChange,
}: AccountPasswordFieldProps): JSX.Element {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const toggleLabel = !visible ? t("account.password.show") : t("account.password.hide");

  return (
    <div className={styles.passwordField}>
      <input
        ref={inputRef}
        className={clsx(styles.input, styles.passwordInput)}
        type={!visible ? "password" : "text"}
        value={value}
        disabled={disabled}
        data-testid="account-password"
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      <button
        type="button"
        className={styles.passwordToggle}
        data-password-toggle="true"
        data-testid="account-password-visibility-toggle"
        aria-label={toggleLabel}
        disabled={disabled}
        onClick={() => {
          setVisible((current) => !current);
        }}
      >
        <AppIcon
          id={!visible ? "form.password.hide" : "form.password.show"}
          preferAnimated={false}
          decorative
          size={18}
          className={styles.passwordToggleIcon}
        />
      </button>
    </div>
  );
}
