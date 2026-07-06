import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TranslationKey } from "../i18n/messages.js";

export type NotificationLevel = "info" | "success" | "warning" | "error";

export type NotificationParams = Readonly<Record<string, string | number | undefined>>;

export type NotificationAction = Readonly<{
  id: string;
  labelKey: TranslationKey;
  onClick: () => void;
}>;

export type NotificationDescriptor = Readonly<{
  id?: string;
  level: NotificationLevel;
  messageKey?: TranslationKey;
  messageText?: string;
  messageParams?: NotificationParams;
  durationMs?: number;
  closable?: boolean;
  action?: NotificationAction;
  onClose?: () => void;
}>;

export type NotificationItem = Readonly<{
  id: string;
  level: NotificationLevel;
  messageKey: TranslationKey | null;
  messageText: string | null;
  messageParams: NotificationParams | null;
  durationMs: number;
  expiresAt: number | null;
  paused: boolean;
  remainingMs: number | null;
  closable: boolean;
  action: NotificationAction | null;
  onClose: (() => void) | null;
}>;

export type UseNotificationsInput = Readonly<{
  placement: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  stacking: "stacked" | "single";
  durationMs: number;
  closable: boolean;
  maxVisible: number;
}>;

export type UseNotificationsResult = Readonly<{
  placement: UseNotificationsInput["placement"];
  stacking: UseNotificationsInput["stacking"];
  items: ReadonlyArray<NotificationItem>;
  notify: (descriptor: NotificationDescriptor) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
}>;

let notificationCounter = 0;

function createNotificationId(): string {
  notificationCounter += 1;
  return `n-${Date.now()}-${notificationCounter}`;
}

/**
 * - Purpose: manage ephemeral renderer notification queue and lifecycle.
 * - Inputs: persisted notification preferences and enqueue descriptors.
 * - Outputs: visible list, enqueue API, dismiss controls, and pause/resume handlers.
 */
export function useNotifications(input: UseNotificationsInput): UseNotificationsResult {
  const { placement, stacking, durationMs, closable, maxVisible } = input;
  const [queue, setQueue] = useState<ReadonlyArray<NotificationItem>>([]);
  const durationRef = useRef(durationMs);
  const closableRef = useRef(closable);

  useEffect(() => {
    durationRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    closableRef.current = closable;
  }, [closable]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setQueue((previous) =>
        previous.filter((item) => item.expiresAt === null || item.expiresAt > now),
      );
    }, 250);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const notify = useCallback(
    (descriptor: NotificationDescriptor): string => {
      const id = descriptor.id ?? createNotificationId();
      const effectiveDuration = descriptor.durationMs ?? durationRef.current;
      const effectiveClosable = descriptor.closable ?? closableRef.current;
      const expiresAt = effectiveDuration > 0 ? Date.now() + effectiveDuration : null;
      const item: NotificationItem = {
        id,
        level: descriptor.level,
        messageKey: descriptor.messageKey ?? null,
        messageText: descriptor.messageText ?? null,
        messageParams: descriptor.messageParams ?? null,
        durationMs: effectiveDuration,
        expiresAt,
        paused: false,
        remainingMs: null,
        closable: effectiveClosable,
        action: descriptor.action ?? null,
        onClose: descriptor.onClose ?? null,
      };

      setQueue((previous) => {
        const withoutSameId = previous.filter((existing) => existing.id !== id);
        if (stacking === "single") {
          return [item];
        }
        return [item, ...withoutSameId];
      });

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

  const pause = useCallback((id: string): void => {
    setQueue((previous) => {
      const now = Date.now();
      return previous.map((item) => {
        if (item.id !== id || item.paused || item.expiresAt === null) {
          return item;
        }
        return {
          ...item,
          paused: true,
          remainingMs: Math.max(0, item.expiresAt - now),
          expiresAt: null,
        };
      });
    });
  }, []);

  const resume = useCallback((id: string): void => {
    setQueue((previous) => {
      const now = Date.now();
      return previous.map((item) => {
        if (item.id !== id || !item.paused) {
          return item;
        }
        const remainingMs = item.remainingMs ?? item.durationMs;
        return {
          ...item,
          paused: false,
          remainingMs: null,
          expiresAt: now + remainingMs,
        };
      });
    });
  }, []);

  const items = useMemo(() => {
    if (stacking === "single") {
      return queue.slice(0, 1);
    }
    return queue.slice(0, maxVisible);
  }, [maxVisible, queue, stacking]);

  return {
    placement,
    stacking,
    items,
    notify,
    dismiss,
    dismissAll,
    pause,
    resume,
  };
}
