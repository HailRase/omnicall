import { app, BrowserWindow, ipcMain, nativeTheme, screen, shell } from "electron";
import { join } from "node:path";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseAppShutdownCancelPayload,
  parseAppShutdownAckPayload,
  type AppShutdownAction,
  type AppShutdownSource,
} from "@shared/ipc/AppShutdownContract.js";
import { parseOpenExternalUrlPayload } from "@shared/ipc/OpenExternalUrlContract.js";
import { parseSetNativeThemePayload } from "@shared/ipc/SetNativeThemeContract.js";
import { parseShellWindowLayoutPayload } from "@shared/ipc/ShellWindowLayoutContract.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { MAIN_WINDOW_INITIAL_BOUNDS } from "@shared/platform/mainWindowBounds.js";
import type { AppIconTheme } from "./resolveAppIconPath.js";
import { resolveAppIconPath } from "./resolveAppIconPath.js";
import { applyAppIcon } from "./loadAppIcon.js";
import { ShellWindowController } from "./shellWindow/ShellWindowController.js";
import { registerProfilesPersistenceIpc } from "./profiles/registerProfilesPersistenceIpc.js";
import { registerContactsCsvIpc } from "./contacts/registerContactsCsvIpc.js";
import { AppShutdownCoordinator } from "./lifecycle/AppShutdownCoordinator.js";
import { installApplicationMenu } from "./lifecycle/createApplicationMenu.js";
import { installDeveloperWebContentsShortcuts } from "./lifecycle/installDeveloperWebContentsShortcuts.js";
import { isMainProcessDevMode } from "./lifecycle/resolveMainProcessDevMode.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-016",
});

const updateLogger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-020",
});

const shutdownCoordinator = new AppShutdownCoordinator();
let isQuitting = false;
let shellWindowController: ShellWindowController | null = null;

function resolvePackagedPlatform(): "win32" | "darwin" | "linux" {
  if (process.platform === "win32" || process.platform === "darwin" || process.platform === "linux") {
    return process.platform;
  }

  return "linux";
}

function resolveAppIconTheme(): AppIconTheme {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

function resolveFramelessShell(): boolean {
  return (
    process.platform === "win32" ||
    process.platform === "linux" ||
    process.platform === "darwin"
  );
}

function createMainWindow(): BrowserWindow {
  const iconPath = resolveAppIconPath(resolveAppIconTheme());
  const frameless = resolveFramelessShell();
  const mainWindow = new BrowserWindow({
    width: MAIN_WINDOW_INITIAL_BOUNDS.width,
    height: MAIN_WINDOW_INITIAL_BOUNDS.height,
    minWidth: MAIN_WINDOW_INITIAL_BOUNDS.minWidth,
    minHeight: MAIN_WINDOW_INITIAL_BOUNDS.minHeight,
    maximizable: false,
    fullscreenable: false,
    resizable: false,
    show: false,
    frame: !frameless,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,
      devTools: isMainProcessDevMode(),
    },
    ...(process.platform === "darwin" || iconPath === null ? {} : { icon: iconPath }),
  });

  shellWindowController = new ShellWindowController(mainWindow, () => {
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    return display.workArea;
  });

  mainWindow.on("ready-to-show", () => {
    shellWindowController?.placeCompactAtStartup();
    mainWindow.show();
  });

  const syncIconWithTheme = (): void => {
    applyAppIcon(mainWindow, resolveAppIconTheme(), logger);
  };
  syncIconWithTheme();
  nativeTheme.on("updated", syncIconWithTheme);
  mainWindow.on("closed", () => {
    nativeTheme.removeListener("updated", syncIconWithTheme);
  });

  mainWindow.on("close", (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    requestRendererShutdown(mainWindow, "window-close", "quit");
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: "deny" };
  });

  installDeveloperWebContentsShortcuts(mainWindow.webContents);

  if (process.env["ELECTRON_RENDERER_URL"] !== undefined) {
    void mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return mainWindow;
}

function requestRendererShutdown(
  mainWindow: BrowserWindow,
  source: AppShutdownSource,
  action: AppShutdownAction,
): { ok: true } | { ok: false; reason: "shutdown_in_progress" | "window_destroyed" } {
  const correlationId = createCorrelationId();
  const beginResult = shutdownCoordinator.beginShutdown(correlationId, action);

  if (beginResult === "already_in_progress") {
    logger.warn("app_shutdown_rejected", {
      correlationId,
      operation: "app_before_close",
      source,
      action,
      result: "shutdown_in_progress",
    });
    return { ok: false, reason: "shutdown_in_progress" };
  }

  logger.info("app_shutdown_requested", {
    correlationId,
    operation: "app_before_close",
    source,
    action,
    result: "notified_renderer",
  });

  if (mainWindow.isDestroyed()) {
    isQuitting = true;
    if (action === "restart") {
      app.relaunch();
      app.exit(0);
    } else {
      app.quit();
    }
    return { ok: false, reason: "window_destroyed" };
  }

  mainWindow.webContents.send(IPC_CHANNELS.appBeforeClose, {
    correlationId,
    source,
    action,
  });

  return { ok: true };
}

function finalizeShutdown(action: AppShutdownAction): void {
  isQuitting = true;

  // Force quit, kill, or OS hard shutdown cannot await async SIP/OCP logout.
  if (action === "restart") {
    app.relaunch();
    app.exit(0);
    return;
  }

  app.quit();
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.platformGetVersion, () => ({
    version: app.getVersion(),
    name: app.getName(),
    platform: resolvePackagedPlatform(),
  }));

  ipcMain.handle(IPC_CHANNELS.platformOpenExternalUrl, async (_event, payload: unknown) => {
    const parsed = parseOpenExternalUrlPayload(payload);
    if (parsed === null) {
      updateLogger.error("open_external_url_rejected", {
        correlationId: createCorrelationId(),
        operation: "open_external_url",
        result: "invalid_payload",
      });
      return { ok: false as const, reason: "invalid_url" };
    }

    try {
      await shell.openExternal(parsed.url);
      updateLogger.info("open_external_url_succeeded", {
        correlationId: createCorrelationId(),
        operation: "open_external_url",
        result: "opened",
      });
      return { ok: true as const };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to open URL";
      updateLogger.error("open_external_url_failed", {
        correlationId: createCorrelationId(),
        operation: "open_external_url",
        result: "error",
        reason: message,
      });
      return { ok: false as const, reason: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.platformSetNativeTheme, (_event, payload: unknown) => {
    const parsed = parseSetNativeThemePayload(payload);
    if (parsed === null) {
      logger.error("set_native_theme_rejected", {
        correlationId: createCorrelationId(),
        operation: "set_native_theme",
        result: "invalid_payload",
      });
      return { ok: false as const };
    }

    nativeTheme.themeSource = parsed.theme;
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow !== undefined && !mainWindow.isDestroyed()) {
      applyAppIcon(mainWindow, resolveAppIconTheme(), logger);
    }

    logger.info("set_native_theme_succeeded", {
      correlationId: createCorrelationId(),
      operation: "set_native_theme",
      result: "updated",
      theme: parsed.theme,
    });
    return { ok: true as const };
  });

  ipcMain.handle(IPC_CHANNELS.shellApplyWindowLayout, async (_event, payload: unknown) => {
    const parsed = parseShellWindowLayoutPayload(payload);
    if (parsed === null || shellWindowController === null) {
      return { ok: false as const };
    }

    logger.info("shell_window_layout_requested", {
      correlationId: createCorrelationId(),
      operation: "shell_apply_window_layout",
      mode: parsed.mode,
      animationDurationMs: parsed.animationDurationMs,
      reducedMotion: parsed.reducedMotion,
      result: "started",
    });

    await shellWindowController.applyLayout(
      parsed.mode,
      parsed.animationDurationMs,
      parsed.reducedMotion,
    );

    return { ok: true as const };
  });

  ipcMain.handle(IPC_CHANNELS.appAcknowledgeShutdown, (_event, payload: unknown) => {
    const parsed = parseAppShutdownAckPayload(payload);
    if (parsed === null) {
      return { ok: false as const, reason: "invalid_payload" };
    }

    const completion = shutdownCoordinator.completeShutdown(
      parsed.correlationId,
      parsed.action,
    );

    if (completion === "rejected") {
      logger.warn("app_shutdown_ack_rejected", {
        correlationId: parsed.correlationId,
        operation: "app_acknowledge_shutdown",
        action: parsed.action,
        result: "rejected",
      });
      return { ok: false as const, reason: "rejected" };
    }

    logger.info("app_shutdown_acknowledged", {
      correlationId: parsed.correlationId,
      operation: "app_acknowledge_shutdown",
      action: parsed.action,
      result: completion,
      cleanupSkipped: parsed.cleanupSkipped,
    });

    finalizeShutdown(parsed.action);
    return { ok: true as const };
  });

  ipcMain.handle(IPC_CHANNELS.appCancelShutdown, (_event, payload: unknown) => {
    const parsed = parseAppShutdownCancelPayload(payload);
    if (parsed === null) {
      return { ok: false as const, reason: "invalid_payload" };
    }

    const cancellation = shutdownCoordinator.cancelShutdown(parsed.correlationId, parsed.action);
    if (cancellation === "rejected") {
      logger.warn("app_shutdown_cancel_rejected", {
        correlationId: parsed.correlationId,
        operation: "app_cancel_shutdown",
        action: parsed.action,
        reason: parsed.reason,
        result: "rejected",
      });
      return { ok: false as const, reason: "rejected" };
    }

    logger.warn("app_shutdown_cancelled", {
      correlationId: parsed.correlationId,
      operation: "app_cancel_shutdown",
      action: parsed.action,
      reason: parsed.reason,
      result: "cancelled",
    });

    return { ok: true as const };
  });

  ipcMain.handle(IPC_CHANNELS.appRequestRestart, () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow === undefined || mainWindow.isDestroyed()) {
      return { ok: false as const, reason: "window_unavailable" };
    }

    const result = requestRendererShutdown(mainWindow, "restart-button", "restart");
    return result.ok
      ? { ok: true as const }
      : { ok: false as const, reason: result.reason };
  });

  ipcMain.handle(IPC_CHANNELS.shellWindowMinimize, () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow === undefined || mainWindow.isDestroyed()) {
      return { ok: false as const, reason: "window_unavailable" };
    }

    mainWindow.minimize();
    return { ok: true as const };
  });

  ipcMain.handle(IPC_CHANNELS.shellWindowClose, () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow === undefined || mainWindow.isDestroyed()) {
      return { ok: false as const, reason: "window_unavailable" };
    }

    const result = requestRendererShutdown(mainWindow, "window-close", "quit");
    return result.ok
      ? { ok: true as const }
      : { ok: false as const, reason: result.reason };
  });
}

void app.whenReady().then(() => {
  const correlationId = createCorrelationId();
  installApplicationMenu();

  logger.info("platform_boot", {
    correlationId,
    operation: "app_ready",
    result: "started",
  });

  registerIpcHandlers();
  registerProfilesPersistenceIpc();
  registerContactsCsvIpc();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("before-quit", (event) => {
  if (isQuitting) {
    return;
  }

  event.preventDefault();
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow === undefined) {
    isQuitting = true;
    app.quit();
    return;
  }

  requestRendererShutdown(mainWindow, "before-quit", "quit");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
