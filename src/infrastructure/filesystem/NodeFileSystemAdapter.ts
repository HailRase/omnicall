import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";

/**
 * - Purpose: Node.js filesystem implementation for profile persistence.
 * - Inputs: absolute paths and UTF-8 text payloads.
 * - Outputs: atomic file writes and directory operations.
 */
export class NodeFileSystemAdapter implements FileSystemPort {
  async ensureDirectory(directoryPath: string): Promise<void> {
    await mkdir(directoryPath, { recursive: true });
  }

  async readTextFile(filePath: string): Promise<string | null> {
    try {
      return await readFile(filePath, "utf8");
    } catch (error: unknown) {
      if (isMissingFileError(error)) {
        return null;
      }
      throw error;
    }
  }

  async writeTextFileAtomic(filePath: string, contents: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp-${process.pid.toString()}-${Date.now().toString()}`;
    await writeFile(tempPath, contents, "utf8");
    await rename(tempPath, filePath);
  }

  async listFiles(directoryPath: string): Promise<ReadonlyArray<string>> {
    try {
      return await readdir(directoryPath);
    } catch (error: unknown) {
      if (isMissingFileError(error)) {
        return [];
      }
      throw error;
    }
  }
}

function isMissingFileError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = error.code;
  return code === "ENOENT";
}
