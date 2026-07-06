export const APP_SHUTDOWN_SOURCES = [
  "before-quit",
  "window-close",
  "restart-button",
] as const;

export const APP_SHUTDOWN_ACTIONS = ["quit", "restart"] as const;

export type AppShutdownSource = (typeof APP_SHUTDOWN_SOURCES)[number];
export type AppShutdownAction = (typeof APP_SHUTDOWN_ACTIONS)[number];

/**
 * - Purpose: shared lifecycle primitives for IPC and domain shutdown flows.
 * - Inputs: unknown source and action values.
 * - Outputs: narrowed shutdown source/action types or false.
 */
export function isAppShutdownSource(value: unknown): value is AppShutdownSource {
  return typeof value === "string" && APP_SHUTDOWN_SOURCES.includes(value as AppShutdownSource);
}

export function isAppShutdownAction(value: unknown): value is AppShutdownAction {
  return typeof value === "string" && APP_SHUTDOWN_ACTIONS.includes(value as AppShutdownAction);
}
