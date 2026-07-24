import type {
  PreferencesExportDialogInput,
  PreferencesExportDialogResult,
  PreferencesFileGateway,
  PreferencesImportDialogResult,
} from "@ports/settings/PreferencesFileGateway.js";

type MockPreferencesFileGatewayState = {
  importResult: PreferencesImportDialogResult;
  exportResult: PreferencesExportDialogResult;
  lastExportInput: PreferencesExportDialogInput | null;
};

/**
 * - Purpose: in-memory preferences file gateway for tests and mock bootstrap.
 * - Inputs: configured import contents and dialog outcomes.
 * - Outputs: deterministic import/export dialog results without Electron dialogs.
 */
export class MockPreferencesFileGateway implements PreferencesFileGateway {
  private readonly state: MockPreferencesFileGatewayState;

  constructor(
    options: Readonly<{
      importContents?: string;
      importResult?: PreferencesImportDialogResult;
      exportResult?: PreferencesExportDialogResult;
    }> = {},
  ) {
    this.state = {
      importResult:
        options.importResult ??
        (options.importContents !== undefined
          ? { kind: "success", contents: options.importContents }
          : { kind: "cancelled" }),
      exportResult:
        options.exportResult ?? {
          kind: "success",
          savedFileName: "axatalk-preferences.json",
        },
      lastExportInput: null,
    };
  }

  openImportDialog(): Promise<PreferencesImportDialogResult> {
    return Promise.resolve(this.state.importResult);
  }

  saveExportDialog(input: PreferencesExportDialogInput): Promise<PreferencesExportDialogResult> {
    this.state.lastExportInput = input;
    if (this.state.exportResult.kind === "success") {
      return Promise.resolve({
        kind: "success",
        savedFileName:
          this.state.exportResult.savedFileName.length > 0
            ? this.state.exportResult.savedFileName
            : input.suggestedFileName,
      });
    }
    return Promise.resolve(this.state.exportResult);
  }

  getLastExportInput(): PreferencesExportDialogInput | null {
    return this.state.lastExportInput;
  }
}
