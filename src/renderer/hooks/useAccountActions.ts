import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { SipAccountInput } from "@application/index.js";
import { isErr } from "@shared/result/index.js";
import { readSipEnvDefaults } from "../bootstrap/readSipEnvDefaults.js";
import { translateCurrent } from "../i18n/index.js";
import type { TranslationKey } from "../i18n/messages.js";

const EMPTY_FORM: SipAccountInput = {
  username: "",
  password: "",
  domain: "",
  server: "",
};

const ACCOUNT_SUCCESS_KEY = "account.success.authorizationSucceeded" as const;
const ACCOUNT_ERROR_UNKNOWN_KEY = "account.error.authorizationFailed" as const;
const FEEDBACK_CLEAR_MS = 3200;

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
  successKey: TranslationKey | null;
  updateField: (field: keyof SipAccountInput, value: string) => void;
  handleSubmit: () => void;
}>;

/**
 * - Purpose: bind SIP account form UI to authorizeManualAccount facade method.
 * - Inputs: account bootstrap facade.
 * - Outputs: form state, submit status, feedback keys, and submit handler.
 */
export function useAccountActions(
  input: UseAccountActionsInput,
): UseAccountActionsResult {
  const { facade } = input;
  const [form, setForm] = useState<SipAccountInput>(buildInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<TranslationKey | null>(null);
  const feedbackClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFeedbackTimer = useCallback((): void => {
    if (feedbackClearTimerRef.current !== null) {
      clearTimeout(feedbackClearTimerRef.current);
      feedbackClearTimerRef.current = null;
    }
  }, []);

  const scheduleFeedbackClear = useCallback((): void => {
    clearFeedbackTimer();
    feedbackClearTimerRef.current = setTimeout(() => {
      setError(null);
      setSuccessKey(null);
      feedbackClearTimerRef.current = null;
    }, FEEDBACK_CLEAR_MS);
  }, [clearFeedbackTimer]);

  useEffect(() => {
    return () => {
      clearFeedbackTimer();
    };
  }, [clearFeedbackTimer]);

  const clearFeedback = useCallback((): void => {
    setError(null);
    setSuccessKey(null);
    clearFeedbackTimer();
  }, [clearFeedbackTimer]);

  const updateField = useCallback((field: keyof SipAccountInput, value: string): void => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    clearFeedback();
  }, [clearFeedback]);

  const handleSubmit = useCallback((): void => {
    if (facade === null || submitting) {
      return;
    }

    void (async (): Promise<void> => {
      setSubmitting(true);
      clearFeedback();

      try {
        const result = await facade.authorizeManualAccount(form);
        if (isErr(result)) {
          setError(result.error.message);
          scheduleFeedbackClear();
          return;
        }
        setSuccessKey(ACCOUNT_SUCCESS_KEY);
        scheduleFeedbackClear();
      } catch (submitError: unknown) {
        const message =
          submitError instanceof Error
            ? submitError.message
            : translateCurrent(ACCOUNT_ERROR_UNKNOWN_KEY);
        setError(message);
        scheduleFeedbackClear();
      } finally {
        setSubmitting(false);
      }
    })();
  }, [facade, form, submitting, clearFeedback, scheduleFeedbackClear]);

  return {
    form,
    submitting,
    error,
    successKey,
    updateField,
    handleSubmit,
  };
}
