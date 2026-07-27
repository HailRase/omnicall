import { resolve } from "node:path";
import { app, ipcMain } from "electron";
import { NodeFileSystemAdapter } from "@infrastructure/filesystem/NodeFileSystemAdapter.js";
import { resolveOmniCallProfilesStorageRoot } from "@infrastructure/bootstrap/resolveOmniCallProfilesStorageRoot.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseProfilesFilesystemOperation,
  type ProfilesFilesystemResponse,
} from "@shared/ipc/ProfilesFilesystemContract.js";
import type { ProfilesStorageRootResponse } from "@shared/ipc/ProfilesStorageContract.js";

const filesystem = new NodeFileSystemAdapter();

/**
 * - Purpose: register main-process IPC for profiles storage root and filesystem ops.
 * - Inputs: Electron app userData path and validated absolute file paths.
 * - Outputs: ipcMain handlers scoped to OmniCall profiles storage root.
 */
export function registerProfilesPersistenceIpc(): void {
  const storageRoot = resolveOmniCallProfilesStorageRoot(app.getPath("userData"));

  ipcMain.handle(IPC_CHANNELS.profilesGetStorageRoot, (): ProfilesStorageRootResponse => ({
    storageRoot,
  }));

  ipcMain.handle(
    IPC_CHANNELS.profilesInvokeFilesystem,
    async (_event, payload: unknown): Promise<ProfilesFilesystemResponse> => {
      const operation = parseProfilesFilesystemOperation(payload);
      if (operation === null) {
        return { ok: false, reason: "invalid_payload" };
      }

      try {
        assertPathUnderStorageRoot(resolvePath(operation), storageRoot);
      } catch {
        return { ok: false, reason: "path_outside_storage_root" };
      }

      try {
        return await executeFilesystemOperation(operation);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "filesystem_error";
        return { ok: false, reason: message };
      }
    },
  );
}

async function executeFilesystemOperation(
  operation: NonNullable<ReturnType<typeof parseProfilesFilesystemOperation>>,
): Promise<ProfilesFilesystemResponse> {
  switch (operation.op) {
    case "ensureDirectory":
      await filesystem.ensureDirectory(operation.directoryPath);
      return { ok: true };
    case "readTextFile": {
      const contents = await filesystem.readTextFile(operation.filePath);
      return { ok: true, contents };
    }
    case "writeTextFileAtomic":
      await filesystem.writeTextFileAtomic(operation.filePath, operation.contents);
      return { ok: true };
    case "listFiles": {
      const files = await filesystem.listFiles(operation.directoryPath);
      return { ok: true, files };
    }
  }
}

function resolvePath(
  operation: NonNullable<ReturnType<typeof parseProfilesFilesystemOperation>>,
): string {
  switch (operation.op) {
    case "ensureDirectory":
      return operation.directoryPath;
    case "readTextFile":
    case "writeTextFileAtomic":
      return operation.filePath;
    case "listFiles":
      return operation.directoryPath;
  }
}

function assertPathUnderStorageRoot(targetPath: string, storageRoot: string): void {
  const normalizedRoot = resolve(storageRoot);
  const normalizedTarget = resolve(targetPath);
  const rootPrefix = `${normalizedRoot}${process.platform === "win32" ? "\\" : "/"}`;

  if (normalizedTarget !== normalizedRoot && !normalizedTarget.startsWith(rootPrefix)) {
    throw new Error("path_outside_storage_root");
  }
}
