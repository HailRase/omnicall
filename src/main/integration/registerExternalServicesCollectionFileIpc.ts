/**
 * - Purpose: register main-process IPC handlers for External Services collection dialogs.
 * - Inputs: renderer invoke requests for open/save JSON dialogs.
 * - Outputs: validated JSON text or cancelled/error responses without exposing paths.
 */

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
  EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES,
  parseExternalServicesCollectionSaveExportDialogPayload,
  sanitizeExternalServicesCollectionSavedFileName,
} from "@shared/ipc/ExternalServicesCollectionFileContract.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import { createCorrelationId } from "@shared/correlation-id/index.js";

const logger = createConsoleLogger({
  boundedContext: "Integration",
  featureId: "F-031",
});

function focusParentWindow(parentWindow: BrowserWindow | null): void {
  if (parentWindow === null) {
    return;
  }
  parentWindow.focus();
  parentWindow.moveTop();
}

function showCollectionOpenDialog(
  parentWindow: BrowserWindow | null,
): Promise<OpenDialogReturnValue> {
  focusParentWindow(parentWindow);
  const openDialogOptions: OpenDialogOptions = {
    title: "Import OmniCall External Service Collection",
    defaultPath: app.getPath("documents"),
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  };
  return dialog.showOpenDialog(openDialogOptions);
}

function showCollectionSaveDialog(
  parentWindow: BrowserWindow | null,
  suggestedFileName: string,
): Promise<SaveDialogReturnValue> {
  focusParentWindow(parentWindow);
  const saveDialogOptions: SaveDialogOptions = {
    title: "Export OmniCall External Service Collection",
    defaultPath: join(app.getPath("documents"), suggestedFileName),
    filters: [{ name: "JSON", extensions: ["json"] }],
  };
  return dialog.showSaveDialog(saveDialogOptions);
}

export function registerExternalServicesCollectionFileIpc(): void {
  ipcMain.handle(IPC_CHANNELS.externalServicesCollectionOpenImportDialog, async (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const correlationId = createCorrelationId();
    const dialogResult = await showCollectionOpenDialog(parentWindow);

    if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
      logger.info("external_services_collection_import_dialog_cancelled", {
        correlationId,
        operation: "external_services_collection_open_import_dialog",
        result: "cancelled",
      });
      return { ok: true as const, cancelled: true as const };
    }

    const filePath = dialogResult.filePaths[0];
    if (filePath === undefined) {
      return { ok: false as const, reason: "missing_file_path" };
    }

    if (!filePath.toLowerCase().endsWith(".json")) {
      return { ok: false as const, reason: "invalid_extension" };
    }

    try {
      const contents = await readFile(filePath, "utf8");
      if (Buffer.byteLength(contents, "utf8") > EXTERNAL_SERVICE_COLLECTION_DOCUMENT_MAX_BYTES) {
        return { ok: false as const, reason: "file_too_large" };
      }

      logger.info("external_services_collection_import_dialog_succeeded", {
        correlationId,
        operation: "external_services_collection_open_import_dialog",
        result: "read",
      });
      return { ok: true as const, cancelled: false as const, contents };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : "read_failed";
      logger.error("external_services_collection_import_dialog_failed", {
        correlationId,
        operation: "external_services_collection_open_import_dialog",
        result: reason,
      });
      return { ok: false as const, reason };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.externalServicesCollectionSaveExportDialog,
    async (event, payload: unknown) => {
      const parsed = parseExternalServicesCollectionSaveExportDialogPayload(payload);
      const correlationId = createCorrelationId();
      if (parsed === null) {
        logger.error("external_services_collection_export_dialog_rejected", {
          correlationId,
          operation: "external_services_collection_save_export_dialog",
          result: "invalid_payload",
        });
        return { ok: false as const, reason: "invalid_payload" };
      }

      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      const dialogResult = await showCollectionSaveDialog(
        parentWindow,
        parsed.suggestedFileName,
      );

      if (dialogResult.canceled || dialogResult.filePath === undefined) {
        logger.info("external_services_collection_export_dialog_cancelled", {
          correlationId,
          operation: "external_services_collection_save_export_dialog",
          result: "cancelled",
        });
        return { ok: true as const, cancelled: true as const };
      }

      try {
        await writeFile(dialogResult.filePath, parsed.contents, "utf8");
        logger.info("external_services_collection_export_dialog_succeeded", {
          correlationId,
          operation: "external_services_collection_save_export_dialog",
          result: "written",
        });
        return {
          ok: true as const,
          cancelled: false as const,
          savedFileName: sanitizeExternalServicesCollectionSavedFileName(
            basename(dialogResult.filePath),
          ),
        };
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : "write_failed";
        logger.error("external_services_collection_export_dialog_failed", {
          correlationId,
          operation: "external_services_collection_save_export_dialog",
          result: reason,
        });
        return { ok: false as const, reason };
      }
    },
  );
}
