import { useEffect, useRef } from "react";
import type { ActiveCallControlsProjection, HeadsetFaultReason } from "@application/index.js";
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
  onOpenSystemState?: () => void;
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
  headsetFault: Readonly<{
    reason: HeadsetFaultReason | null;
    occurredAt: string | null;
  }>;
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

function mapHeadsetFaultMessageKey(reason: HeadsetFaultReason): TranslationKey {
  switch (reason) {
    case "connect_failed":
      return "notification.headset.fault.connect_failed";
    case "unsupported":
      return "notification.headset.fault.unsupported";
    case "usb_disconnected":
      return "notification.headset.fault.usb_disconnected";
    case "device_error":
      return "notification.headset.fault.device_error";
    case "led_blocked":
      return "notification.headset.fault.led_blocked";
  }
}

function headsetFaultLevel(
  reason: HeadsetFaultReason,
): NotificationDescriptor["level"] {
  if (reason === "usb_disconnected" || reason === "led_blocked") {
    return "warning";
  }
  return "error";
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
    onOpenSystemState,
    callControls,
    dtmfError,
    transferFailure,
    logoutErrorMessage,
    settingsUpdateError,
    sipActionSuccessKey,
    sipActionErrorText,
    headsetFault,
  } = input;
  const { notify } = notifications;
  const openSystemStateRef = useRef(onOpenSystemState);
  openSystemStateRef.current = onOpenSystemState;
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
      module: "account",
      functionId: "account.sign_in",
    });
  }, [accountFeedback.successKey, notify]);

  useEffect(() => {
    if (accountFeedback.warningKey === null) {
      return;
    }
    notify({
      level: "warning",
      messageKey: accountFeedback.warningKey,
      module: "account",
      functionId: "account.sign_in_metadata",
    });
  }, [accountFeedback.warningKey, notify]);

  useEffect(() => {
    if (accountError === null) {
      return;
    }
    notify({
      ...buildAccountErrorDescriptor(accountError),
      module: "account",
      functionId: "account.sign_in",
    });
    if (openSystemStateRef.current !== undefined) {
      notify({
        level: "info",
        messageKey: "account.notification.openSystemState",
        module: "account",
        functionId: "account.open_system_state",
        action: {
          id: "account-open-system-state",
          labelKey: "account.notification.openSystemStateAction",
          onClick: () => {
            openSystemStateRef.current?.();
          },
        },
      });
    }
  }, [accountError, notify]);

  useEffect(() => {
    if (lastOperationError === null) {
      return;
    }
    notify({
      level: "error",
      messageText: lastOperationError.message,
      module: "telephony",
      functionId: `call.${lastOperationError.operation}`,
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
      module: "telephony",
      functionId: "call.dtmf",
    });
  }, [dtmfError, notify]);

  useEffect(() => {
    if (transferFailure === null) {
      return;
    }
    notify({
      level: "error",
      messageText: transferFailure,
      module: "telephony",
      functionId: "call.transfer",
    });
  }, [notify, transferFailure]);

  useEffect(() => {
    if (logoutErrorMessage === null) {
      return;
    }
    notify({
      level: "error",
      messageText: logoutErrorMessage,
      module: "account",
      functionId: "account.logout",
    });
  }, [logoutErrorMessage, notify]);

  useEffect(() => {
    if (settingsUpdateError === null) {
      return;
    }
    notify({
      level: "error",
      messageText: settingsUpdateError,
      module: "settings",
      functionId: "settings.update",
    });
  }, [notify, settingsUpdateError]);

  useEffect(() => {
    if (sipActionSuccessKey === null) {
      return;
    }
    notify({
      level: "success",
      messageKey: sipActionSuccessKey,
      module: "telephony",
      functionId: "sip.recovery",
    });
  }, [notify, sipActionSuccessKey]);

  useEffect(() => {
    if (sipActionErrorText === null) {
      return;
    }
    notify({
      level: "error",
      messageText: sipActionErrorText,
      module: "telephony",
      functionId: "sip.recovery",
    });
  }, [notify, sipActionErrorText]);

  useEffect(() => {
    if (headsetFault.reason === null || headsetFault.occurredAt === null) {
      return;
    }
    notify({
      level: headsetFaultLevel(headsetFault.reason),
      messageKey: mapHeadsetFaultMessageKey(headsetFault.reason),
      module: "headset",
      functionId: "headset.fault",
    });
  }, [headsetFault.occurredAt, headsetFault.reason, notify]);
}
