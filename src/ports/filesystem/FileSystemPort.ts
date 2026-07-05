/**
 * - Purpose: abstract filesystem access for adapters and infrastructure.
 * - Inputs: absolute paths and UTF-8 text payloads.
 * - Outputs: directory creation, atomic writes, file reads, directory listings.
 */
export interface FileSystemPort {
  ensureDirectory(directoryPath: string): Promise<void>;
  readTextFile(filePath: string): Promise<string | null>;
  writeTextFileAtomic(filePath: string, contents: string): Promise<void>;
  listFiles(directoryPath: string): Promise<ReadonlyArray<string>>;
}
