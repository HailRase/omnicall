import { app, BrowserWindow, ipcMain, screen, shell } from "electron";
import { join } from "node:path";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import { parseAppShutdownAckPayload } from "@shared/ipc/AppShutdownContract.js";
import { parseShellWindowLayoutPayload } from "@shared/ipc/ShellWindowLayoutContract.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { ShellWindowController } from "./shellWindow/ShellWindowController.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-000",
});

let isQuitting = false;
let shellWindowController: ShellWindowController | null = null;

function createMainWindow(): BrowserWindow {
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
  });

  shellWindowController = new ShellWindowController(mainWindow, () => {
    const display = screen.getDisplayMatching(mainWindow.getBounds());
    return display.workArea;
  });

  mainWindow.on("ready-to-show", () => {
    shellWindowController?.placeCompactAtStartup();
    mainWindow.show();
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
  }));

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
