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
  placeholder?: string;
  autoComplete?: string;
  "aria-label"?: string;
  inputTestId?: string;
  toggleTestId?: string;
  showAriaLabel?: string;
  hideAriaLabel?: string;
}>;

/**
 * - Purpose: render secret input (SIP password / OCP API key) with visibility toggle.
 * - Inputs: value, disabled, optional labels/test ids, change callback.
 * - Outputs: accessible password-style field matching Account SIP password chrome.
 */
export function AccountPasswordField({
  value,
  disabled,
  inputRef,
  onChange,
  placeholder,
  autoComplete,
  "aria-label": ariaLabel,
  inputTestId = "account-password",
  toggleTestId = "account-password-visibility-toggle",
  showAriaLabel,
  hideAriaLabel,
}: AccountPasswordFieldProps): JSX.Element {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const resolvedShowLabel = showAriaLabel ?? t("account.password.show");
  const resolvedHideLabel = hideAriaLabel ?? t("account.password.hide");
  const toggleLabel = !visible ? resolvedShowLabel : resolvedHideLabel;

  return (
    <div className={styles.passwordField}>
      <input
        ref={inputRef}
        className={clsx(styles.input, styles.passwordInput)}
        type={!visible ? "password" : "text"}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        data-testid={inputTestId}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      <button
        type="button"
        className={styles.passwordToggle}
        data-password-toggle="true"
        data-testid={toggleTestId}
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
