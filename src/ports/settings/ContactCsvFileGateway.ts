/**
 * - Purpose: narrow port for contacts CSV open/save dialogs and file IO.
 * - Inputs: export CSV text and optional suggested filename.
 * - Outputs: cancelled, imported contents, or persisted export result.
 */
export type ContactCsvImportDialogResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "success"; contents: string }
  | { kind: "error"; reason: string }
>;

export type ContactCsvExportDialogInput = Readonly<{
  contents: string;
  suggestedFileName: string;
}>;

export type ContactCsvExportDialogResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "success"; savedFileName: string }
  | { kind: "error"; reason: string }
>;

export interface ContactCsvFileGateway {
  openImportDialog(): Promise<ContactCsvImportDialogResult>;
  saveExportDialog(input: ContactCsvExportDialogInput): Promise<ContactCsvExportDialogResult>;
}
