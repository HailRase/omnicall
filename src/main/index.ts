import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-000",
});

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 420,
    height: 720,
    minWidth: 360,
    minHeight: 560,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
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

function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.platformGetVersion, () => ({
    version: app.getVersion(),
    name: app.getName(),
  }));
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
