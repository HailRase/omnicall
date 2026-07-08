import type {
  ContactCsvExportDialogInput,
  ContactCsvExportDialogResult,
  ContactCsvFileGateway,
  ContactCsvImportDialogResult,
} from "@ports/settings/ContactCsvFileGateway.js";
import { createPlatformError } from "@shared/errors/index.js";
import { err, ok } from "@shared/result/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import {
  parseContactsCsvOpenImportDialogResponse,
  parseContactsCsvSaveExportDialogPayload,
  parseContactsCsvSaveExportDialogResponse,
} from "@shared/ipc/ContactsCsvFileContract.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";

/**
 * - Purpose: renderer adapter for contacts CSV dialogs via typed preload IPC.
 * - Inputs: export CSV text and suggested filename.
 * - Outputs: import contents or export save result mapped to gateway unions.
 */
export class PreloadContactCsvFileGateway implements ContactCsvFileGateway {
  async openImportDialog(): Promise<ContactCsvImportDialogResult> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { kind: "error", reason: "preload_unavailable" };
    }

    const response: unknown = await softphone.openContactsCsvImportDialog();
    const parsed = parseContactsCsvOpenImportDialogResponse(response);
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
  }

  async saveExportDialog(input: ContactCsvExportDialogInput): Promise<ContactCsvExportDialogResult> {
    const softphone = window.softphone;
    if (softphone === undefined) {
      return { kind: "error", reason: "preload_unavailable" };
    }

    const payload = parseContactsCsvSaveExportDialogPayload({
      contents: input.contents,
      suggestedFileName: input.suggestedFileName,
    });
    if (payload === null) {
      return { kind: "error", reason: "invalid_payload" };
    }

    const response: unknown = await softphone.saveContactsCsvExportDialog(payload);
    const parsed = parseContactsCsvSaveExportDialogResponse(response);
    if (parsed === null) {
      return { kind: "error", reason: "invalid_response" };
    }

    if (!parsed.ok) {
      return { kind: "error", reason: parsed.reason };
    }

    if (parsed.cancelled) {
      return { kind: "cancelled" };
    }

    return { kind: "success" };
  }
}

/**
 * - Purpose: map gateway Result helpers for tests and optional callers.
 * - Inputs: ContactCsvImportDialogResult.
 * - Outputs: Result with CSV contents or normalized PlatformError.
 */
export function mapContactCsvImportDialogResult(
  result: ContactCsvImportDialogResult,
): Result<string, PlatformError> {
  if (result.kind === "cancelled") {
    return err(createPlatformError("cancelled", "Import cancelled"));
  }
  if (result.kind === "error") {
    return err(createPlatformError("operation_failed", result.reason));
  }
  return ok(result.contents);
}

/**
 * - Purpose: map gateway Result helpers for tests and optional callers.
 * - Inputs: ContactCsvExportDialogResult.
 * - Outputs: Result<void> or normalized PlatformError.
 */
export function mapContactCsvExportDialogResult(
  result: ContactCsvExportDialogResult,
): Result<void, PlatformError> {
  if (result.kind === "cancelled") {
    return err(createPlatformError("cancelled", "Export cancelled"));
  }
  if (result.kind === "error") {
    return err(createPlatformError("operation_failed", result.reason));
  }
  return ok(undefined);
}

export const CONTACTS_CSV_IPC_CHANNELS = {
  openImportDialog: IPC_CHANNELS.contactsCsvOpenImportDialog,
  saveExportDialog: IPC_CHANNELS.contactsCsvSaveExportDialog,
} as const;
