/**
 * - Purpose: narrow port for operator preferences open/save dialogs and file IO.
 * - Inputs: export JSON text and optional suggested filename.
 * - Outputs: cancelled, imported contents, or persisted export result.
 */
export type PreferencesImportDialogResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "success"; contents: string }
  | { kind: "error"; reason: string }
>;

export type PreferencesExportDialogInput = Readonly<{
  contents: string;
  suggestedFileName: string;
}>;

export type PreferencesExportDialogResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "success"; savedFileName: string }
  | { kind: "error"; reason: string }
>;

export interface PreferencesFileGateway {
  openImportDialog(): Promise<PreferencesImportDialogResult>;
  saveExportDialog(input: PreferencesExportDialogInput): Promise<PreferencesExportDialogResult>;
}
