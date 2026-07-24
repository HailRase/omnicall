import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type OpenDialogOptions,
  type OpenDialogReturnValue,
  type SaveDialogOptions,
  type SaveDialogReturnValue,
} from "electron";
import { basename, join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parsePreferencesSaveExportDialogPayload,
  sanitizePreferencesSavedFileName,
} from "@shared/ipc/PreferencesFileContract.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

const logger = createConsoleLogger({
  boundedContext: "Settings",
  featureId: "F-030",
});

const MAX_IMPORT_BYTES = 512 * 1024;

function focusParentWindow(parentWindow: BrowserWindow | null): void {
  if (parentWindow === null) {
    return;
  }
  parentWindow.focus();
  parentWindow.moveTop();
}

function showPreferencesOpenDialog(
  parentWindow: BrowserWindow | null,
): Promise<OpenDialogReturnValue> {
  focusParentWindow(parentWindow);
  const openDialogOptions: OpenDialogOptions = {
    title: "Import Axatalk Preferences",
    defaultPath: app.getPath("documents"),
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  };
  return dialog.showOpenDialog(openDialogOptions);
}

function showPreferencesSaveDialog(
  parentWindow: BrowserWindow | null,
  suggestedFileName: string,
): Promise<SaveDialogReturnValue> {
  focusParentWindow(parentWindow);
  const saveDialogOptions: SaveDialogOptions = {
    title: "Export Axatalk Preferences",
    defaultPath: join(app.getPath("documents"), suggestedFileName),
    filters: [{ name: "JSON", extensions: ["json"] }],
  };
  return dialog.showSaveDialog(saveDialogOptions);
}

/**
 * - Purpose: register main-process IPC handlers for preferences import/export dialogs.
 * - Inputs: renderer invoke requests for open/save JSON dialogs.
 * - Outputs: validated JSON text or cancelled/error responses without exposing raw IPC.
 */
export function registerPreferencesFileIpc(): void {
  ipcMain.handle(IPC_CHANNELS.preferencesOpenImportDialog, async (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const correlationId = createCorrelationId();
    const dialogResult = await showPreferencesOpenDialog(parentWindow);

    if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
      logger.info("preferences_import_dialog_cancelled", {
        correlationId,
        operation: "preferences_open_import_dialog",
        result: "cancelled",
      });
      return { ok: true as const, cancelled: true as const };
    }

    const filePath = dialogResult.filePaths[0];
    if (filePath === undefined) {
      return { ok: false as const, reason: "missing_file_path" };
    }

    try {
      const contents = await readFile(filePath, "utf8");
      if (Buffer.byteLength(contents, "utf8") > MAX_IMPORT_BYTES) {
        return { ok: false as const, reason: "file_too_large" };
      }

      logger.info("preferences_import_dialog_succeeded", {
        correlationId,
        operation: "preferences_open_import_dialog",
        result: "read",
      });
      return { ok: true as const, cancelled: false as const, contents };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : "read_failed";
      logger.error("preferences_import_dialog_failed", {
        correlationId,
        operation: "preferences_open_import_dialog",
        result: reason,
      });
      return { ok: false as const, reason };
    }
  });

  ipcMain.handle(IPC_CHANNELS.preferencesSaveExportDialog, async (event, payload: unknown) => {
    const parsed = parsePreferencesSaveExportDialogPayload(payload);
    const correlationId = createCorrelationId();
    if (parsed === null) {
      logger.error("preferences_export_dialog_rejected", {
        correlationId,
        operation: "preferences_save_export_dialog",
        result: "invalid_payload",
      });
      return { ok: false as const, reason: "invalid_payload" };
    }

    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const dialogResult = await showPreferencesSaveDialog(parentWindow, parsed.suggestedFileName);

    if (dialogResult.canceled || dialogResult.filePath === undefined) {
      logger.info("preferences_export_dialog_cancelled", {
        correlationId,
        operation: "preferences_save_export_dialog",
        result: "cancelled",
      });
      return { ok: true as const, cancelled: true as const };
    }

    try {
      await writeFile(dialogResult.filePath, parsed.contents, "utf8");
      logger.info("preferences_export_dialog_succeeded", {
        correlationId,
        operation: "preferences_save_export_dialog",
        result: "written",
      });
      return {
        ok: true as const,
        cancelled: false as const,
        savedFileName: sanitizePreferencesSavedFileName(basename(dialogResult.filePath)),
      };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : "write_failed";
      logger.error("preferences_export_dialog_failed", {
        correlationId,
        operation: "preferences_save_export_dialog",
        result: reason,
      });
      return { ok: false as const, reason };
    }
  });
}
