import { useEffect } from "react";
import type { ActiveCallControlsProjection } from "@application/index.js";
import type { AccountAuthorizationErrorProjection } from "@application/projections/settings/mapAccountAuthorizationError.js";
import type { TranslationKey } from "../i18n/messages.js";
import type {
  NotificationDescriptor,
  UseNotificationsResult,
} from "./useNotifications.js";

type NotificationApi = Pick<UseNotificationsResult, "notify">;

type UseActionNotificationsInput = Readonly<{
  notifications: NotificationApi;
  accountFeedback: Readonly<{
    error: AccountAuthorizationErrorProjection | null;
    successKey: TranslationKey | null;
    warningKey: TranslationKey | null;
  }>;
  callControls: Readonly<{
    projection: ActiveCallControlsProjection;
    onRetry: () => void;
  }>;
  dtmfError: string | null;
  transferFailure: string | null;
  logoutErrorMessage: string | null;
  settingsUpdateError: string | null;
  sipActionSuccessKey: TranslationKey | null;
  sipActionErrorText: string | null;
}>;

function buildAccountErrorDescriptor(
  error: AccountAuthorizationErrorProjection,
): Required<Pick<NotificationDescriptor, "level" | "messageKey">> &
  Pick<NotificationDescriptor, "messageParams"> {
  if (error.params !== undefined) {
    return {
      level: "error",
      messageKey: error.key,
      messageParams: error.params,
    };
  }
  return {
    level: "error",
    messageKey: error.key,
  };
}

/**
 * - Purpose: bridge action outcome sources into unified renderer notifications.
 * - Inputs: action feedback projections and callbacks from feature hooks.
 * - Outputs: side effects that enqueue global notifications for every action outcome.
 */
export function useActionNotifications(input: UseActionNotificationsInput): void {
  const {
    notifications,
    accountFeedback,
    callControls,
    dtmfError,
    transferFailure,
    logoutErrorMessage,
    settingsUpdateError,
    sipActionSuccessKey,
    sipActionErrorText,
  } = input;
  const { notify } = notifications;
  const {
    projection: callControlsProjection,
    onRetry: retryCallOperation,
  } = callControls;
  const accountError = accountFeedback.error;
  const lastOperationError = callControlsProjection.lastOperationError;

  useEffect(() => {
    if (accountFeedback.successKey === null) {
      return;
    }
    notify({
      level: "success",
      messageKey: accountFeedback.successKey,
    });
  }, [accountFeedback.successKey, notify]);

  useEffect(() => {
    if (accountFeedback.warningKey === null) {
      return;
    }
    notify({
      level: "warning",
      messageKey: accountFeedback.warningKey,
    });
  }, [accountFeedback.warningKey, notify]);

  useEffect(() => {
    if (accountError === null) {
      return;
    }
    notify(buildAccountErrorDescriptor(accountError));
  }, [accountError, notify]);

  useEffect(() => {
    if (lastOperationError === null) {
      return;
    }
    notify({
      level: "error",
      messageText: lastOperationError.message,
      action: {
        id: `retry-call-${lastOperationError.operation}`,
        labelKey: "common.retry",
        onClick: retryCallOperation,
      },
    });
  }, [lastOperationError, notify, retryCallOperation]);

  useEffect(() => {
    if (dtmfError === null) {
      return;
    }
    notify({
      level: "error",
      messageText: dtmfError,
    });
  }, [dtmfError, notify]);

  useEffect(() => {
    if (transferFailure === null) {
      return;
    }
    notify({
      level: "error",
      messageText: transferFailure,
    });
  }, [notify, transferFailure]);

  useEffect(() => {
    if (logoutErrorMessage === null) {
      return;
    }
    notify({
      level: "error",
      messageText: logoutErrorMessage,
    });
  }, [logoutErrorMessage, notify]);

  useEffect(() => {
    if (settingsUpdateError === null) {
      return;
    }
    notify({
      level: "error",
      messageText: settingsUpdateError,
    });
  }, [notify, settingsUpdateError]);

  useEffect(() => {
    if (sipActionSuccessKey === null) {
      return;
    }
    notify({
      level: "success",
      messageKey: sipActionSuccessKey,
    });
  }, [notify, sipActionSuccessKey]);

  useEffect(() => {
    if (sipActionErrorText === null) {
      return;
    }
    notify({
      level: "error",
      messageText: sipActionErrorText,
    });
  }, [notify, sipActionErrorText]);
}
