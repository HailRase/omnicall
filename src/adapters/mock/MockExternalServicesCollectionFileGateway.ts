/**
 * - Purpose: provide deterministic External Services collection file outcomes in tests.
 * - Inputs: configured import contents and save dialog results.
 * - Outputs: isolated import/export results without Electron or filesystem access.
 */
import type {
  ExternalServicesCollectionExportDialogInput,
  ExternalServicesCollectionExportDialogResult,
  ExternalServicesCollectionFileGateway,
  ExternalServicesCollectionImportDialogResult,
} from "@ports/integration/ExternalServicesCollectionFileGateway.js";

type MockExternalServicesCollectionFileGatewayState = {
  importResult: ExternalServicesCollectionImportDialogResult;
  exportResult: ExternalServicesCollectionExportDialogResult;
  lastExportInput: ExternalServicesCollectionExportDialogInput | null;
};

export class MockExternalServicesCollectionFileGateway
  implements ExternalServicesCollectionFileGateway
{
  private readonly state: MockExternalServicesCollectionFileGatewayState;

  constructor(
    options: Readonly<{
      importContents?: string;
      importResult?: ExternalServicesCollectionImportDialogResult;
      exportResult?: ExternalServicesCollectionExportDialogResult;
    }> = {},
  ) {
    this.state = {
      importResult:
        options.importResult ??
        (options.importContents === undefined
          ? { kind: "cancelled" }
          : { kind: "success", contents: options.importContents }),
      exportResult:
        options.exportResult ?? {
          kind: "success",
          savedFileName: "omnicall-external-service.json",
        },
      lastExportInput: null,
    };
  }

  openImportDialog(): Promise<ExternalServicesCollectionImportDialogResult> {
    return Promise.resolve(this.state.importResult);
  }

  saveExportDialog(
    input: ExternalServicesCollectionExportDialogInput,
  ): Promise<ExternalServicesCollectionExportDialogResult> {
    this.state.lastExportInput = input;
    if (this.state.exportResult.kind !== "success") {
      return Promise.resolve(this.state.exportResult);
    }

    return Promise.resolve({
      kind: "success",
      savedFileName:
        this.state.exportResult.savedFileName.length > 0
          ? this.state.exportResult.savedFileName
          : input.suggestedFileName,
    });
  }

  getLastExportInput(): ExternalServicesCollectionExportDialogInput | null {
    return this.state.lastExportInput;
  }
}
