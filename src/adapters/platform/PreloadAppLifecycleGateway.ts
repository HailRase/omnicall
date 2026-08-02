import type { AppLifecycleGateway } from "@ports/platform/AppLifecycleGateway.js";
import type {
  AppShutdownCancelReason,
  AppShutdownPayload,
} from "@shared/ipc/AppShutdownContract.js";
import { parseShellWindowControlResponse } from "@shared/ipc/ShellWindowControlContract.js";
import type { AppShutdownAction } from "@shared/platform/AppLifecycle.js";

/**
 * - Purpose: renderer adapter for app shutdown and custom shell window controls (F-016).
 * - Inputs: lifecycle commands from renderer hooks.
 * - Outputs: typed preload IPC invocations and shutdown event subscription.
 */
export class PreloadAppLifecycleGateway implements AppLifecycleGateway {
  async requestRestart(): ReturnType<AppLifecycleGateway["requestRestart"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false, reason: "preload_unavailable" };
    }

    const response: unknown = await softphone.requestAppRestart();
    return parseShellWindowControlResponse(response) ?? { ok: false, reason: "invalid_response" };
  }

  async requestClose(): ReturnType<AppLifecycleGateway["requestClose"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false, reason: "preload_unavailable" };
    }

    const response: unknown = await softphone.closeWindow();
    return parseShellWindowControlResponse(response) ?? { ok: false, reason: "invalid_response" };
  }

  async minimizeWindow(): ReturnType<AppLifecycleGateway["minimizeWindow"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false, reason: "preload_unavailable" };
    }

    const response: unknown = await softphone.minimizeWindow();
    return parseShellWindowControlResponse(response) ?? { ok: false, reason: "invalid_response" };
  }

  async toggleMaximizeWindow(): ReturnType<AppLifecycleGateway["toggleMaximizeWindow"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false, reason: "preload_unavailable" };
    }

    const response: unknown = await softphone.toggleMaximizeWindow();
    return parseShellWindowControlResponse(response) ?? { ok: false, reason: "invalid_response" };
  }

  async getWindowMaximized(): ReturnType<AppLifecycleGateway["getWindowMaximized"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false };
    }

    const response: unknown = await softphone.getWindowMaximized();
    if (typeof response !== "object" || response === null) {
      return { ok: false };
    }
    const candidate = response as Record<string, unknown>;
    if (candidate["ok"] !== true || typeof candidate["maximized"] !== "boolean") {
      return { ok: false };
    }
    return { ok: true, maximized: candidate["maximized"] };
  }

  onWindowMaximizedChanged(handler: (maximized: boolean) => void): () => void {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return () => {};
    }

    return softphone.onWindowMaximizedChanged(handler);
  }

  async setWindowAlwaysOnTop(
    alwaysOnTop: boolean,
  ): ReturnType<AppLifecycleGateway["setWindowAlwaysOnTop"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false };
    }
    const response: unknown = await softphone.setWindowAlwaysOnTop({ alwaysOnTop });
    if (typeof response !== "object" || response === null) {
      return { ok: false };
    }
    const candidate = response as Record<string, unknown>;
    if (candidate["ok"] !== true || typeof candidate["alwaysOnTop"] !== "boolean") {
      return { ok: false };
    }
    return { ok: true, alwaysOnTop: candidate["alwaysOnTop"] };
  }

  async toggleWindowAlwaysOnTop(): ReturnType<AppLifecycleGateway["toggleWindowAlwaysOnTop"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false };
    }
    const response: unknown = await softphone.toggleWindowAlwaysOnTop();
    if (typeof response !== "object" || response === null) {
      return { ok: false };
    }
    const candidate = response as Record<string, unknown>;
    if (candidate["ok"] !== true || typeof candidate["alwaysOnTop"] !== "boolean") {
      return { ok: false };
    }
    return { ok: true, alwaysOnTop: candidate["alwaysOnTop"] };
  }

  async getWindowAlwaysOnTop(): ReturnType<AppLifecycleGateway["getWindowAlwaysOnTop"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false };
    }
    const response: unknown = await softphone.getWindowAlwaysOnTop();
    if (typeof response !== "object" || response === null) {
      return { ok: false };
    }
    const candidate = response as Record<string, unknown>;
    if (candidate["ok"] !== true || typeof candidate["alwaysOnTop"] !== "boolean") {
      return { ok: false };
    }
    return { ok: true, alwaysOnTop: candidate["alwaysOnTop"] };
  }

  onWindowAlwaysOnTopChanged(handler: (alwaysOnTop: boolean) => void): () => void {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return () => {};
    }
    return softphone.onWindowAlwaysOnTopChanged(handler);
  }

  onBeforeClose(handler: (payload: AppShutdownPayload) => void): () => void {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return () => {};
    }

    return softphone.onBeforeClose(handler);
  }

  async acknowledgeShutdown(
    correlationId: AppShutdownPayload["correlationId"],
    action: AppShutdownAction,
    cleanupSkipped: boolean,
  ): ReturnType<AppLifecycleGateway["acknowledgeShutdown"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false, reason: "preload_unavailable" };
    }

    const response: unknown = await softphone.acknowledgeShutdown({
      correlationId,
      action,
      cleanupSkipped,
    });
    return parseShellWindowControlResponse(response) ?? { ok: false, reason: "invalid_response" };
  }

  async cancelShutdown(
    correlationId: AppShutdownPayload["correlationId"],
    action: AppShutdownAction,
    reason: AppShutdownCancelReason,
  ): ReturnType<AppLifecycleGateway["cancelShutdown"]> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { ok: false, reason: "preload_unavailable" };
    }

    const response: unknown = await softphone.cancelShutdown({ correlationId, action, reason });
    return parseShellWindowControlResponse(response) ?? { ok: false, reason: "invalid_response" };
  }
}
