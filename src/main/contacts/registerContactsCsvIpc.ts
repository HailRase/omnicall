import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions, type OpenDialogReturnValue, type SaveDialogOptions, type SaveDialogReturnValue } from "electron";
import { basename, join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseContactsCsvSaveExportDialogPayload,
  sanitizeContactsCsvSavedFileName,
} from "@shared/ipc/ContactsCsvFileContract.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

const logger = createConsoleLogger({
  boundedContext: "Settings",
  featureId: "F-025",
});

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

function focusParentWindow(parentWindow: BrowserWindow | null): void {
  if (parentWindow === null) {
    return;
  }
  parentWindow.focus();
  parentWindow.moveTop();
}

function showContactsCsvOpenDialog(parentWindow: BrowserWindow | null): Promise<OpenDialogReturnValue> {
  focusParentWindow(parentWindow);
  const openDialogOptions: OpenDialogOptions = {
    title: "Import Contacts CSV",
    defaultPath: app.getPath("documents"),
    properties: ["openFile"],
    filters: [{ name: "CSV", extensions: ["csv"] }],
  };
  // Detached dialog is more reliable for frameless custom shells on Windows.
  return dialog.showOpenDialog(openDialogOptions);
}

function showContactsCsvSaveDialog(
  parentWindow: BrowserWindow | null,
  suggestedFileName: string,
): Promise<SaveDialogReturnValue> {
  focusParentWindow(parentWindow);
  const saveDialogOptions: SaveDialogOptions = {
    title: "Export Contacts CSV",
    defaultPath: join(app.getPath("documents"), suggestedFileName),
    filters: [{ name: "CSV", extensions: ["csv"] }],
  };
  return dialog.showSaveDialog(saveDialogOptions);
}

/**
 * - Purpose: register main-process IPC handlers for contacts CSV import/export dialogs.
 * - Inputs: renderer invoke requests for open/save CSV dialogs.
 * - Outputs: validated CSV text or cancelled/error responses without exposing raw IPC.
 */
export function registerContactsCsvIpc(): void {
  ipcMain.handle(IPC_CHANNELS.contactsCsvOpenImportDialog, async (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const correlationId = createCorrelationId();
    const dialogResult = await showContactsCsvOpenDialog(parentWindow);

    if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
      logger.info("contacts_csv_import_dialog_cancelled", {
        correlationId,
        operation: "contacts_csv_open_import_dialog",
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

      logger.info("contacts_csv_import_dialog_succeeded", {
        correlationId,
        operation: "contacts_csv_open_import_dialog",
        result: "read",
      });
      return { ok: true as const, cancelled: false as const, contents };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : "read_failed";
      logger.error("contacts_csv_import_dialog_failed", {
        correlationId,
        operation: "contacts_csv_open_import_dialog",
        result: reason,
      });
      return { ok: false as const, reason };
    }
  });

  ipcMain.handle(IPC_CHANNELS.contactsCsvSaveExportDialog, async (event, payload: unknown) => {
    const parsed = parseContactsCsvSaveExportDialogPayload(payload);
    const correlationId = createCorrelationId();
    if (parsed === null) {
      logger.error("contacts_csv_export_dialog_rejected", {
        correlationId,
        operation: "contacts_csv_save_export_dialog",
        result: "invalid_payload",
      });
      return { ok: false as const, reason: "invalid_payload" };
    }

    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const dialogResult = await showContactsCsvSaveDialog(parentWindow, parsed.suggestedFileName);

    if (dialogResult.canceled || dialogResult.filePath === undefined) {
      logger.info("contacts_csv_export_dialog_cancelled", {
        correlationId,
        operation: "contacts_csv_save_export_dialog",
        result: "cancelled",
      });
      return { ok: true as const, cancelled: true as const };
    }

    try {
      await writeFile(dialogResult.filePath, parsed.contents, "utf8");
      logger.info("contacts_csv_export_dialog_succeeded", {
        correlationId,
        operation: "contacts_csv_save_export_dialog",
        result: "written",
      });
      return {
        ok: true as const,
        cancelled: false as const,
        savedFileName: sanitizeContactsCsvSavedFileName(basename(dialogResult.filePath)),
      };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : "write_failed";
      logger.error("contacts_csv_export_dialog_failed", {
        correlationId,
        operation: "contacts_csv_save_export_dialog",
        result: reason,
      });
      return { ok: false as const, reason };
    }
  });
}
