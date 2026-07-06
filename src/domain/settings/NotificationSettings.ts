export const NOTIFICATION_PLACEMENTS = [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
] as const;

export type NotificationPlacement = (typeof NOTIFICATION_PLACEMENTS)[number];

export const NOTIFICATION_STACKING_MODES = ["stacked", "single"] as const;

export type NotificationStacking = (typeof NOTIFICATION_STACKING_MODES)[number];

export const MIN_NOTIFICATION_DURATION_MS = 2000;
export const MAX_NOTIFICATION_DURATION_MS = 10000;
export const DEFAULT_NOTIFICATION_DURATION_MS = 4200;

export const MIN_NOTIFICATION_MAX_VISIBLE = 1;
export const MAX_NOTIFICATION_MAX_VISIBLE = 5;
export const DEFAULT_NOTIFICATION_MAX_VISIBLE = 3;

export const DEFAULT_NOTIFICATION_PLACEMENT: NotificationPlacement = "bottom-right";
export const DEFAULT_NOTIFICATION_STACKING: NotificationStacking = "stacked";
export const DEFAULT_NOTIFICATION_CLOSABLE = true;

export function parseNotificationPlacement(value: unknown): NotificationPlacement | null {
  return typeof value === "string" &&
    (NOTIFICATION_PLACEMENTS as readonly string[]).includes(value)
    ? (value as NotificationPlacement)
    : null;
}

export function parseNotificationStacking(value: unknown): NotificationStacking | null {
  return typeof value === "string" &&
    (NOTIFICATION_STACKING_MODES as readonly string[]).includes(value)
    ? (value as NotificationStacking)
    : null;
}

export function clampNotificationDurationMs(value: number): number {
  return Math.min(MAX_NOTIFICATION_DURATION_MS, Math.max(MIN_NOTIFICATION_DURATION_MS, value));
}

export function clampNotificationMaxVisible(value: number): number {
  return Math.min(MAX_NOTIFICATION_MAX_VISIBLE, Math.max(MIN_NOTIFICATION_MAX_VISIBLE, value));
}
