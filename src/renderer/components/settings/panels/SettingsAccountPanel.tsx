import type { JSX } from "react";
import type { SipAccountInput } from "@application/index.js";
import { AccountPanel } from "../../account/AccountPanel.js";
import styles from "./SettingsAccountPanel.module.css";

export type SettingsAccountPanelProps = Readonly<{
  form: SipAccountInput;
  submitting: boolean;
  error: string | null;
  disabled?: boolean;
  onFieldChange: (field: keyof SipAccountInput, value: string) => void;
  onSubmit: () => void;
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
  disabled = false,
  onFieldChange,
  onSubmit,
}: SettingsAccountPanelProps): JSX.Element {
  return (
    <div className={styles["wrapper"]} data-testid="settings-account-panel">
      <AccountPanel
        form={form}
        submitting={submitting}
        error={error}
        disabled={disabled}
        onFieldChange={onFieldChange}
        onSubmit={onSubmit}
        showTitle={false}
      />
    </div>
  );
}
