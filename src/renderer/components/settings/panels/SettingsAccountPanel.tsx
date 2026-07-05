import type { JSX } from "react";
import type { SipAccountInput } from "@application/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import { AccountPanel } from "../../account/AccountPanel.js";
import styles from "./SettingsAccountPanel.module.css";

export type SettingsAccountPanelProps = Readonly<{
  form: SipAccountInput;
  submitting: boolean;
  error: string | null;
  successKey: TranslationKey | null;
  disabled?: boolean;
  authorizeDisabledReason: string | null;
  logoutDisabledReason: string | null;
  onFieldChange: (field: keyof SipAccountInput, value: string) => void;
  onSubmit: () => void;
  onLogout: () => void;
}>;

/**
 * - Purpose: embed SIP account authorization form inside settings Account section.
 * - Inputs: account form state, submit status, and field callbacks.
 * - Outputs: presentational account panel without Use Case calls.
 */
export function SettingsAccountPanel({
  form,
  submitting,
  error,
  successKey,
  disabled = false,
  authorizeDisabledReason,
  logoutDisabledReason,
  onFieldChange,
  onSubmit,
  onLogout,
}: SettingsAccountPanelProps): JSX.Element {
  return (
    <div className={styles.wrapper} data-testid="settings-account-panel">
      <AccountPanel
        form={form}
        submitting={submitting}
        error={error}
        successKey={successKey}
        disabled={disabled}
        authorizeDisabledReason={authorizeDisabledReason}
        logoutDisabledReason={logoutDisabledReason}
        onFieldChange={onFieldChange}
        onSubmit={onSubmit}
        onLogout={onLogout}
        showTitle={false}
      />
    </div>
  );
}
