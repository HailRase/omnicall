import type {
  PreferencesExportDialogInput,
  PreferencesExportDialogResult,
  PreferencesFileGateway,
  PreferencesImportDialogResult,
} from "@ports/settings/PreferencesFileGateway.js";
import {
  parsePreferencesOpenImportDialogResponse,
  parsePreferencesSaveExportDialogPayload,
  parsePreferencesSaveExportDialogResponse,
} from "@shared/ipc/PreferencesFileContract.js";

/**
 * - Purpose: renderer adapter for preferences dialogs via typed preload IPC.
 * - Inputs: export JSON text and suggested filename.
 * - Outputs: import contents or export save result mapped to gateway unions.
 */
export class PreloadPreferencesFileGateway implements PreferencesFileGateway {
  async openImportDialog(): Promise<PreferencesImportDialogResult> {
    try {
      const softphone = window.softphone;
      if (softphone === undefined) {
        return { kind: "error", reason: "preload_unavailable" };
      }

      const response: unknown = await softphone.openPreferencesImportDialog();
      const parsed = parsePreferencesOpenImportDialogResponse(response);
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
    input: PreferencesExportDialogInput,
  ): Promise<PreferencesExportDialogResult> {
    try {
      const softphone = window.softphone;
      if (softphone === undefined) {
        return { kind: "error", reason: "preload_unavailable" };
      }

      const payload = parsePreferencesSaveExportDialogPayload({
        contents: input.contents,
        suggestedFileName: input.suggestedFileName,
      });
      if (payload === null) {
        return { kind: "error", reason: "invalid_payload" };
      }

      const response: unknown = await softphone.savePreferencesExportDialog(payload);
      const parsed = parsePreferencesSaveExportDialogResponse(response);
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
