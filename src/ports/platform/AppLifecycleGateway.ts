import type {
  AppShutdownCancelReason,
  AppShutdownPayload,
} from "@shared/ipc/AppShutdownContract.js";
import type { ShellWindowControlResponse } from "@shared/ipc/ShellWindowControlContract.js";
import type { AppShutdownAction } from "@shared/platform/AppLifecycle.js";

/**
 * - Purpose: port for Electron app lifecycle and custom shell window controls (F-016).
 * - Inputs: restart, close, and minimize commands from renderer hooks.
 * - Outputs: IPC-backed lifecycle actions without exposing Electron APIs.
 */
export interface AppLifecycleGateway {
  requestRestart(): Promise<ShellWindowControlResponse>;
  requestClose(): Promise<ShellWindowControlResponse>;
  minimizeWindow(): Promise<ShellWindowControlResponse>;
  onBeforeClose(handler: (payload: AppShutdownPayload) => void): () => void;
  acknowledgeShutdown(
    correlationId: AppShutdownPayload["correlationId"],
    action: AppShutdownAction,
    cleanupSkipped: boolean,
  ): Promise<ShellWindowControlResponse>;
  cancelShutdown(
    correlationId: AppShutdownPayload["correlationId"],
    action: AppShutdownAction,
    reason: AppShutdownCancelReason,
  ): Promise<ShellWindowControlResponse>;
}
