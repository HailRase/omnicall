/**
 * - Purpose: isolate External Services collection document file operations.
 * - Inputs: JSON collection content and an optional suggested filename.
 * - Outputs: cancelled, imported content, or saved-file outcomes.
 */
export type ExternalServicesCollectionImportDialogResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "success"; contents: string }
  | { kind: "error"; reason: string }
>;

export type ExternalServicesCollectionExportDialogInput = Readonly<{
  contents: string;
  suggestedFileName: string;
}>;

export type ExternalServicesCollectionExportDialogResult = Readonly<
  | { kind: "cancelled" }
  | { kind: "success"; savedFileName: string }
  | { kind: "error"; reason: string }
>;

export interface ExternalServicesCollectionFileGateway {
  openImportDialog(): Promise<ExternalServicesCollectionImportDialogResult>;
  saveExportDialog(
    input: ExternalServicesCollectionExportDialogInput,
  ): Promise<ExternalServicesCollectionExportDialogResult>;
}
