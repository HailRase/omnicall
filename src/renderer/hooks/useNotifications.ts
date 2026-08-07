import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UserNotificationModuleFilter as UserNotificationModule } from "@application/projections/settings/userNotificationJournalViewModel.js";
import type { TranslationKey } from "../i18n/messages.js";

export type NotificationLevel = "info" | "success" | "warning" | "error";

export type NotificationParams = Readonly<Record<string, string | number | undefined>>;

export type NotificationAction = Readonly<{
  id: string;
  labelKey: TranslationKey;
  onClick: () => void;
}>;

/** Mirrors Domain `NotificationInterruptClass` (renderer must not import Domain). */
export type NotificationInterruptClass =
  | "critical"
  | "actionable"
  | "informational"
  | "remote";

export type NotificationDescriptor = Readonly<{
  id?: string;
  level: NotificationLevel;
  messageKey?: TranslationKey;
  messageText?: string;
  messageParams?: NotificationParams;
  durationMs?: number;
  action?: NotificationAction;
  onClose?: () => void;
  module?: UserNotificationModule;
  functionId?: string;
  correlationId?: string | null;
  interruptClass?: NotificationInterruptClass;
}>;

export type NotificationItem = Readonly<{
  id: string;
  level: NotificationLevel;
  messageKey: TranslationKey | null;
  messageText: string | null;
  messageParams: NotificationParams | null;
  durationMs: number;
  closable: boolean;
  action: NotificationAction | null;
  onClose: (() => void) | null;
}>;

export type UseNotificationsInput = Readonly<{
  placement: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  stacking: "stacked" | "single";
  durationMs: number;
  maxVisible: number;
  closable?: boolean;
  capture?: (
    descriptor: NotificationDescriptor,
    id: string,
    titleSnapshot: string,
  ) => Promise<
    Readonly<{
      shouldPresentPopup: boolean;
      shouldRaiseWindow?: boolean;
    }>
  >;
  resolveTitle?: (descriptor: NotificationDescriptor) => string;
  /**
   * ADR-0013 optional raise for actionable errors/warnings (WU-08).
   * Injected by shell; never called for informational/remote policy outcomes.
   */
  raiseWindow?: (
    payload: Readonly<{ reason: "notification_actionable"; dedupeKey: string }>,
  ) => Promise<unknown>;
  /**
   * Unexpected capture throw only. Journal-failed outcomes must still return
   * policy decisions from CaptureService (no prefs bypass).
   */
  onCaptureFailure?: (error: unknown) => void;
}>;

export type UseNotificationsResult = Readonly<{
  placement: UseNotificationsInput["placement"];
  stacking: UseNotificationsInput["stacking"];
  durationMs: number;
  maxVisible: number;
  items: ReadonlyArray<NotificationItem>;
  notify: (descriptor: NotificationDescriptor) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}>;

let notificationCounter = 0;

function createNotificationId(): string {
  notificationCounter += 1;
  return `n-${Date.now()}-${notificationCounter}`;
}

function areNotificationParamsEqual(
  left: NotificationParams | null,
  right: NotificationParams | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (left === null || right === null) {
    return false;
  }
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  return leftKeys.every((key, index) => {
    if (key !== rightKeys[index]) {
      return false;
    }
    return left[key] === right[key];
  });
}

function areNotificationActionsEqual(
  left: NotificationAction | null,
  right: NotificationAction | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (left === null || right === null) {
    return false;
  }
  return (
    left.id === right.id &&
    left.labelKey === right.labelKey &&
    left.onClick === right.onClick
  );
}

function areNotificationItemsEqual(left: NotificationItem, right: NotificationItem): boolean {
  return (
    left.id === right.id &&
    left.level === right.level &&
    left.messageKey === right.messageKey &&
    left.messageText === right.messageText &&
    areNotificationParamsEqual(left.messageParams, right.messageParams) &&
    left.durationMs === right.durationMs &&
    left.closable === right.closable &&
    areNotificationActionsEqual(left.action, right.action) &&
    left.onClose === right.onClose
  );
}

/**
 * - Purpose: manage ephemeral renderer notification queue for UI Kit toast rendering.
 * - Inputs: persisted notification preferences and enqueue descriptors.
 * - Outputs: visible list, enqueue API, and dismiss controls.
 */
export function useNotifications(input: UseNotificationsInput): UseNotificationsResult {
  const {
    placement,
    stacking,
    durationMs,
    maxVisible,
    closable = true,
    capture,
    resolveTitle,
    raiseWindow,
    onCaptureFailure,
  } = input;
  const [queue, setQueue] = useState<ReadonlyArray<NotificationItem>>([]);
  const durationRef = useRef(durationMs);
  const closableRef = useRef(closable);
  const raiseWindowRef = useRef(raiseWindow);
  const onCaptureFailureRef = useRef(onCaptureFailure);
  const captureRef = useRef(capture);
  const resolveTitleRef = useRef(resolveTitle);

  useEffect(() => {
    durationRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    closableRef.current = closable;
  }, [closable]);

  useEffect(() => {
    raiseWindowRef.current = raiseWindow;
  }, [raiseWindow]);

  useEffect(() => {
    onCaptureFailureRef.current = onCaptureFailure;
  }, [onCaptureFailure]);

  useEffect(() => {
    captureRef.current = capture;
  }, [capture]);

  useEffect(() => {
    resolveTitleRef.current = resolveTitle;
  }, [resolveTitle]);

  // Keep notify identity stable across language/title-resolver changes so Settings
  // integration hooks do not re-bootstrap and race concurrent UserSettings writes.
  const notify = useCallback(
    (descriptor: NotificationDescriptor): string => {
      const id = descriptor.id ?? createNotificationId();
      const effectiveDuration = descriptor.durationMs ?? durationRef.current;
      const item: NotificationItem = {
        id,
        level: descriptor.level,
        messageKey: descriptor.messageKey ?? null,
        messageText: descriptor.messageText ?? null,
        messageParams: descriptor.messageParams ?? null,
        durationMs: effectiveDuration,
        closable: closableRef.current,
        action: descriptor.action ?? null,
        onClose: descriptor.onClose ?? null,
      };

      const enqueue = (): void => setQueue((previous) => {
        const existingItem = previous.find((existing) => existing.id === id);
        if (existingItem !== undefined && areNotificationItemsEqual(existingItem, item)) {
          return previous;
        }
        const withoutSameId = previous.filter((existing) => existing.id !== id);
        if (stacking === "single") {
          return [item];
        }
        return [item, ...withoutSameId];
      });

      const captureFn = captureRef.current;
      if (captureFn === undefined) {
        enqueue();
      } else {
        const titleSnapshot =
          resolveTitleRef.current?.(descriptor) ??
          descriptor.messageText ??
          descriptor.messageKey ??
          "";
        void captureFn(descriptor, id, titleSnapshot)
          .then((outcome) => {
            if (outcome.shouldPresentPopup) {
              enqueue();
            }
            if (outcome.shouldRaiseWindow === true) {
              void raiseWindowRef.current?.({
                reason: "notification_actionable",
                dedupeKey: id,
              });
            }
          })
          .catch((error: unknown) => {
            onCaptureFailureRef.current?.(error);
            // Last-resort fail-open only for unexpected throws (not journal IO).
            enqueue();
          });
      }

      return id;
    },
    [stacking],
  );

  const dismiss = useCallback((id: string): void => {
    setQueue((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const dismissAll = useCallback((): void => {
    setQueue([]);
  }, []);

  const items = useMemo(() => {
    if (stacking === "single") {
      return queue.slice(0, 1);
    }
    return queue.slice(0, maxVisible);
  }, [maxVisible, queue, stacking]);

  return useMemo(
    () => ({
      placement,
      stacking,
      durationMs,
      maxVisible,
      items,
      notify,
      dismiss,
      dismissAll,
    }),
    [
      dismiss,
      dismissAll,
      durationMs,
      items,
      maxVisible,
      notify,
      placement,
      stacking,
    ],
  );
}
