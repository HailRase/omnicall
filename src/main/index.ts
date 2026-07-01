import { app, BrowserWindow, ipcMain, nativeTheme, screen, shell } from "electron";
import { join } from "node:path";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import { parseAppShutdownAckPayload } from "@shared/ipc/AppShutdownContract.js";
import { parseOpenExternalUrlPayload } from "@shared/ipc/OpenExternalUrlContract.js";
import { parseSetNativeThemePayload } from "@shared/ipc/SetNativeThemeContract.js";
import { parseShellWindowLayoutPayload } from "@shared/ipc/ShellWindowLayoutContract.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import type { AppIconTheme } from "./resolveAppIconPath.js";
import { resolveAppIconPath } from "./resolveAppIconPath.js";
import { applyAppIcon } from "./loadAppIcon.js";
import { ShellWindowController } from "./shellWindow/ShellWindowController.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-000",
});

const updateLogger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-020",
});

function resolvePackagedPlatform(): "win32" | "darwin" | "linux" {
  if (process.platform === "win32" || process.platform === "darwin" || process.platform === "linux") {
    return process.platform;
  }

  return "linux";
}
let isQuitting = false;
let shellWindowController: ShellWindowController | null = null;

function resolveAppIconTheme(): AppIconTheme {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

function createMainWindow(): BrowserWindow {
  const iconPath = resolveAppIconPath(resolveAppIconTheme());
  const mainWindow = new BrowserWindow({
    width: 360,
    height: 625,
    minWidth: 360,
    minHeight: 560,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,
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
    notifyRendererBeforeClose(mainWindow, "window-close");
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (process.env["ELECTRON_RENDERER_URL"] !== undefined) {
    void mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    void mainWindow.loadFile(
      join(__dirname, "../renderer/index.html"),
    );
  }

  return mainWindow;
}

function notifyRendererBeforeClose(
  mainWindow: BrowserWindow,
  source: "before-quit" | "window-close",
): void {
  const correlationId = createCorrelationId();
  logger.info("app_shutdown_requested", {
    correlationId,
    operation: "app_before_close",
    source,
    result: "notified_renderer",
  });

  if (mainWindow.isDestroyed()) {
    isQuitting = true;
    app.quit();
    return;
  }

  mainWindow.webContents.send(IPC_CHANNELS.appBeforeClose, {
    correlationId,
    source,
  });
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
      return { ok: false as const };
    }

    logger.info("app_shutdown_acknowledged", {
      correlationId: parsed.correlationId,
      operation: "app_acknowledge_shutdown",
      result: "acknowledged",
    });

    isQuitting = true;
    app.quit();
    return { ok: true as const };
  });
}

void app.whenReady().then(() => {
  const correlationId = createCorrelationId();
  logger.info("platform_boot", {
    correlationId,
    operation: "app_ready",
    result: "started",
  });

  registerIpcHandlers();
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

  notifyRendererBeforeClose(mainWindow, "before-quit");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
