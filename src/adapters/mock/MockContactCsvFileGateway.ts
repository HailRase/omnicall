import type {
  ContactCsvExportDialogInput,
  ContactCsvExportDialogResult,
  ContactCsvFileGateway,
  ContactCsvImportDialogResult,
} from "@ports/settings/ContactCsvFileGateway.js";

type MockContactCsvFileGatewayState = {
  importContents: string | null;
  importResult: ContactCsvImportDialogResult;
  exportResult: ContactCsvExportDialogResult;
  lastExportInput: ContactCsvExportDialogInput | null;
};

/**
 * - Purpose: in-memory contacts CSV gateway for tests and mock bootstrap flows.
 * - Inputs: configured import contents and dialog outcomes.
 * - Outputs: deterministic import/export dialog results without Electron dialogs.
 */
export class MockContactCsvFileGateway implements ContactCsvFileGateway {
  private readonly state: MockContactCsvFileGatewayState;

  constructor(
    options: Readonly<{
      importContents?: string;
      importResult?: ContactCsvImportDialogResult;
      exportResult?: ContactCsvExportDialogResult;
    }> = {},
  ) {
    this.state = {
      importContents: options.importContents ?? null,
      importResult:
        options.importResult ??
        (options.importContents !== undefined
          ? { kind: "success", contents: options.importContents }
          : { kind: "cancelled" }),
      exportResult: options.exportResult ?? { kind: "success" },
      lastExportInput: null,
    };
  }

  openImportDialog(): Promise<ContactCsvImportDialogResult> {
    return Promise.resolve(this.state.importResult);
  }

  saveExportDialog(input: ContactCsvExportDialogInput): Promise<ContactCsvExportDialogResult> {
    this.state.lastExportInput = input;
    return Promise.resolve(this.state.exportResult);
  }

  getLastExportInput(): ContactCsvExportDialogInput | null {
    return this.state.lastExportInput;
  }
}
