/**
 * - Purpose: renderer adapter for External Services collection dialogs via typed preload IPC.
 * - Inputs: export JSON text and suggested filename.
 * - Outputs: import contents or export save result mapped to gateway unions.
 */

import type {
  ExternalServicesCollectionExportDialogInput,
  ExternalServicesCollectionExportDialogResult,
  ExternalServicesCollectionFileGateway,
  ExternalServicesCollectionImportDialogResult,
} from "@ports/integration/ExternalServicesCollectionFileGateway.js";
import {
  parseExternalServicesCollectionOpenImportDialogResponse,
  parseExternalServicesCollectionSaveExportDialogPayload,
  parseExternalServicesCollectionSaveExportDialogResponse,
} from "@shared/ipc/ExternalServicesCollectionFileContract.js";

export class PreloadExternalServicesCollectionFileGateway
  implements ExternalServicesCollectionFileGateway
{
  async openImportDialog(): Promise<ExternalServicesCollectionImportDialogResult> {
    try {
      const softphone = window.softphone;
      if (softphone === undefined) {
        return { kind: "error", reason: "preload_unavailable" };
      }

      const response: unknown = await softphone.openExternalServicesCollectionImportDialog();
      const parsed = parseExternalServicesCollectionOpenImportDialogResponse(response);
      if (parsed === null) {
        return { kind: "error", reason: "invalid_response" };
      }

      if (!parsed.ok) {
        return { kind: "error", reason: parsed.reason };
      }

      if (parsed.cancelled) {
        return { kind: "cancelled" };
      }

      return { kind: "success", contents: parsed.contents };
    } catch {
      return { kind: "error", reason: "import_dialog_failed" };
    }
  }

  async saveExportDialog(
    input: ExternalServicesCollectionExportDialogInput,
  ): Promise<ExternalServicesCollectionExportDialogResult> {
    try {
      const softphone = window.softphone;
      if (softphone === undefined) {
        return { kind: "error", reason: "preload_unavailable" };
      }

      const payload = parseExternalServicesCollectionSaveExportDialogPayload({
        contents: input.contents,
        suggestedFileName: input.suggestedFileName,
      });
      if (payload === null) {
        return { kind: "error", reason: "invalid_payload" };
      }

      const response: unknown =
        await softphone.saveExternalServicesCollectionExportDialog(payload);
      const parsed = parseExternalServicesCollectionSaveExportDialogResponse(response);
      if (parsed === null) {
        return { kind: "error", reason: "invalid_response" };
      }

      if (!parsed.ok) {
        return { kind: "error", reason: parsed.reason };
      }

      if (parsed.cancelled) {
        return { kind: "cancelled" };
      }

      return { kind: "success", savedFileName: parsed.savedFileName };
    } catch {
      return { kind: "error", reason: "export_dialog_failed" };
    }
  }
}
