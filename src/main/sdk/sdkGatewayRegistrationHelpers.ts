/**
 * Shared helpers for SDK gateway main registration (keeps registerSdkGateway lean).
 */

import { join } from "node:path";

import type { LocalWsServerAdapter } from "@adapters/integration/LocalWsServerAdapter.js";
import { resolveAxatalkProfilesStorageRoot } from "@infrastructure/bootstrap/resolveAxatalkProfilesStorageRoot.js";
import { IPC_CHANNELS } from "@shared/ipc/IpcChannels.js";
import { parseSdkGatewayPublishEventIpcPayload } from "@shared/ipc/SdkGatewayEventContract.js";
import { app, ipcMain } from "electron";

import { ElectronSafeStorageSecretService } from "../secrets/ElectronSafeStorageSecretService.js";
import { MainProcessSecretStorageAdapter } from "../secrets/MainProcessSecretStorageAdapter.js";

let publishEventIpcRegistered = false;

export function createSdkGatewaySecretStorage(): MainProcessSecretStorageAdapter {
  const storageRoot = resolveAxatalkProfilesStorageRoot(app.getPath("userData"));
  return new MainProcessSecretStorageAdapter(
    new ElectronSafeStorageSecretService(join(storageRoot, "secrets")),
  );
}

export function registerSdkGatewayPublishEventIpc(
  getGateway: () => LocalWsServerAdapter | null,
): void {
  if (publishEventIpcRegistered || typeof ipcMain?.handle !== "function") {
    return;
  }
  publishEventIpcRegistered = true;
  ipcMain.handle(IPC_CHANNELS.sdkGatewayPublishEvent, (_event, payload: unknown) => {
    const parsed = parseSdkGatewayPublishEventIpcPayload(payload);
    const gateway = getGateway();
    if (parsed === null || gateway === null) {
      return { ok: false as const, delivered: 0 };
    }
    const delivered = gateway.publishPublicEvent(parsed.draft);
    return { ok: true as const, delivered };
  });
}

export function unregisterSdkGatewayPublishEventIpcForTests(): void {
  if (publishEventIpcRegistered && typeof ipcMain?.removeHandler === "function") {
    ipcMain.removeHandler(IPC_CHANNELS.sdkGatewayPublishEvent);
  }
  publishEventIpcRegistered = false;
}
