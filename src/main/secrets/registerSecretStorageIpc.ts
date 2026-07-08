import { join } from "node:path";
import { app, ipcMain } from "electron";
import { resolveAxatalkProfilesStorageRoot } from "@infrastructure/bootstrap/resolveAxatalkProfilesStorageRoot.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import {
  parseSecretStorageOperation,
  type SecretStorageResponse,
} from "@shared/ipc/SecretStorageContract.js";
import { ElectronSafeStorageSecretService } from "./ElectronSafeStorageSecretService.js";

/**
 * - Purpose: register main-process IPC for encrypted secret save, load, and delete.
 * - Inputs: Electron app userData path and validated secret storage operations.
 * - Outputs: ipcMain handler scoped to Axatalk secrets directory.
 */
export function registerSecretStorageIpc(): void {
  const storageRoot = resolveAxatalkProfilesStorageRoot(app.getPath("userData"));
  const secretsRoot = join(storageRoot, "secrets");
  const secretService = new ElectronSafeStorageSecretService(secretsRoot);

  ipcMain.handle(
    IPC_CHANNELS.secretsInvoke,
    async (_event, payload: unknown): Promise<SecretStorageResponse> => {
      const operation = parseSecretStorageOperation(payload);
      if (operation === null) {
        return { ok: false, reason: "invalid_payload" };
      }

      switch (operation.op) {
        case "save":
          return secretService.saveSecret(operation.scopeKey, operation.secretId, operation.value);
        case "load":
          return secretService.loadSecret(operation.scopeKey, operation.secretId);
        case "delete":
          return secretService.deleteSecret(operation.scopeKey, operation.secretId);
      }
    },
  );
}
