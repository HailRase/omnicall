import { BrowserWindow, dialog, ipcMain, type OpenDialogOptions, type SaveDialogOptions } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import { parseContactsCsvSaveExportDialogPayload } from "@shared/ipc/ContactsCsvFileContract.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

const logger = createConsoleLogger({
  boundedContext: "Settings",
  featureId: "F-025",
});

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

/**
 * - Purpose: register main-process IPC handlers for contacts CSV import/export dialogs.
 * - Inputs: renderer invoke requests for open/save CSV dialogs.
 * - Outputs: validated CSV text or cancelled/error responses without exposing raw IPC.
 */
export function registerContactsCsvIpc(): void {
  ipcMain.handle(IPC_CHANNELS.contactsCsvOpenImportDialog, async (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const correlationId = createCorrelationId();
    const openDialogOptions: OpenDialogOptions = {
      title: "Import Contacts CSV",
      properties: ["openFile"],
      filters: [{ name: "CSV", extensions: ["csv"] }],
    };
    const dialogResult =
      parentWindow === null
        ? await dialog.showOpenDialog(openDialogOptions)
        : await dialog.showOpenDialog(parentWindow, openDialogOptions);

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
    const saveDialogOptions: SaveDialogOptions = {
      title: "Export Contacts CSV",
      defaultPath: parsed.suggestedFileName,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    };
    const dialogResult =
      parentWindow === null
        ? await dialog.showSaveDialog(saveDialogOptions)
        : await dialog.showSaveDialog(parentWindow, saveDialogOptions);

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
      return { ok: true as const, cancelled: false as const };
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
