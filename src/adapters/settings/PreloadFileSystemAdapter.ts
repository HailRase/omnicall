import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import {
  parseProfilesFilesystemResponse,
  type ProfilesFilesystemOperation,
} from "@shared/ipc/ProfilesFilesystemContract.js";

type ProfilesFilesystemInvoker = (
  operation: ProfilesFilesystemOperation,
) => Promise<unknown>;

/**
 * - Purpose: renderer FileSystemPort backed by main-process profiles filesystem IPC.
 * - Inputs: absolute paths and UTF-8 payloads from FileSettingsRepository.
 * - Outputs: delegated directory and atomic file operations via preload bridge.
 */
export class PreloadFileSystemAdapter implements FileSystemPort {
  private readonly invokeFilesystem: ProfilesFilesystemInvoker;

  constructor(invokeFilesystem?: ProfilesFilesystemInvoker) {
    this.invokeFilesystem =
      invokeFilesystem ??
      ((operation) => window.softphone.invokeProfilesFilesystem(operation));
  }

  async ensureDirectory(directoryPath: string): Promise<void> {
    await this.invokeOperation({ op: "ensureDirectory", directoryPath });
  }

  async readTextFile(filePath: string): Promise<string | null> {
    const response = await this.invokeOperation({ op: "readTextFile", filePath });
    return response.contents ?? null;
  }

  async writeTextFileAtomic(filePath: string, contents: string): Promise<void> {
    await this.invokeOperation({ op: "writeTextFileAtomic", filePath, contents });
  }

  async listFiles(directoryPath: string): Promise<ReadonlyArray<string>> {
    const response = await this.invokeOperation({ op: "listFiles", directoryPath });
    return response.files ?? [];
  }

  private async invokeOperation(
    operation: ProfilesFilesystemOperation,
  ): Promise<NonNullable<ReturnType<typeof parseProfilesFilesystemResponse>>> {
    const rawResponse = await this.invokeFilesystem(operation);
    const parsed = parseProfilesFilesystemResponse(rawResponse);
    if (parsed === null || !parsed.ok) {
      const reason = parsed?.reason ?? "invalid_filesystem_response";
      throw new Error(reason);
    }
    return parsed;
  }
}
