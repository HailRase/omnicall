import { useState, type JSX, type SubmitEvent } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { SipAccountInput } from "@application/index.js";
import { isErr } from "@shared/result/index.js";
import { readSipEnvDefaults } from "../../bootstrap/readSipEnvDefaults.js";

type AccountPanelProps = Readonly<{
  facade: AccountBootstrapFacade;
  disabled?: boolean;
}>;

const EMPTY_FORM: SipAccountInput = {
  username: "",
  password: "",
  domain: "",
  server: "",
};

function buildInitialForm(): SipAccountInput {
  return {
    ...EMPTY_FORM,
    ...readSipEnvDefaults(),
  };
}

export function AccountPanel({
  facade,
  disabled = false,
}: AccountPanelProps): JSX.Element {
  const [form, setForm] = useState<SipAccountInput>(buildInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await facade.authorizeManualAccount(form);
      if (isErr(result)) {
        setError(result.error.message);
      }
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Authorization failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="account-panel" data-testid="account-panel">
      <h2>SIP Account</h2>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <label>
          Username
          <input
            value={form.username}
            disabled={disabled || submitting}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                username: event.target.value,
              }));
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
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }));
            }}
          />
        </label>
        <label>
          Domain
          <input
            value={form.domain}
            disabled={disabled || submitting}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                domain: event.target.value,
              }));
            }}
          />
        </label>
        <label>
          Server
          <input
            value={form.server}
            disabled={disabled || submitting}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                server: event.target.value,
              }));
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
