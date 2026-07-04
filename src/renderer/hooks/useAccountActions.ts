import { useCallback, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { SipAccountInput } from "@application/index.js";
import { isErr } from "@shared/result/index.js";
import { readSipEnvDefaults } from "../bootstrap/readSipEnvDefaults.js";
import { translateCurrent } from "../i18n/index.js";

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

type UseAccountActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
}>;

type UseAccountActionsResult = Readonly<{
  form: SipAccountInput;
  submitting: boolean;
  error: string | null;
  updateField: (field: keyof SipAccountInput, value: string) => void;
  handleSubmit: () => void;
}>;

/**
 * - Purpose: bind SIP account form UI to authorizeManualAccount facade method.
 * - Inputs: account bootstrap facade.
 * - Outputs: form state, submit status, and submit handler.
 */
export function useAccountActions(
  input: UseAccountActionsInput,
): UseAccountActionsResult {
  const { facade } = input;
  const [form, setForm] = useState<SipAccountInput>(buildInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback((field: keyof SipAccountInput, value: string): void => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback((): void => {
    if (facade === null || submitting) {
      return;
    }

    void (async (): Promise<void> => {
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
            : translateCurrent("account.error.authorizationFailed");
        setError(message);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [facade, form, submitting]);

  return {
    form,
    submitting,
    error,
    updateField,
    handleSubmit,
  };
}
