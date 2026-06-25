import type { JSX, SubmitEvent } from "react";
import type { SipAccountInput } from "@application/index.js";

type AccountPanelProps = Readonly<{
  form: SipAccountInput;
  submitting: boolean;
  error: string | null;
  disabled?: boolean;
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
  onFieldChange,
  onSubmit,
}: AccountPanelProps): JSX.Element {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="account-panel" data-testid="account-panel">
      <h2>SIP Account</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input
            value={form.username}
            disabled={disabled || submitting}
            onChange={(event) => {
              onFieldChange("username", event.target.value);
            }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            disabled={disabled || submitting}
            onChange={(event) => {
              onFieldChange("password", event.target.value);
            }}
          />
        </label>
        <label>
          Domain
          <input
            value={form.domain}
            disabled={disabled || submitting}
            onChange={(event) => {
              onFieldChange("domain", event.target.value);
            }}
          />
        </label>
        <label>
          Server
          <input
            value={form.server}
            disabled={disabled || submitting}
            onChange={(event) => {
              onFieldChange("server", event.target.value);
            }}
          />
        </label>
        <button type="submit" disabled={disabled || submitting}>
          Authorize and register
        </button>
      </form>
      {error !== null && (
        <p className="account-panel__error" role="alert" data-testid="account-error">
          {error}
        </p>
      )}
    </section>
  );
}
