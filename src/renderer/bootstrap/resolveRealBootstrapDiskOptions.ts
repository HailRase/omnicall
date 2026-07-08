import type { AdapterMode } from "@infrastructure/bootstrap/adapterMode.js";
import type { CreateAccountBootstrapOptions } from "@infrastructure/bootstrap/createMockAccountBootstrap.js";
import { PreloadFileSystemAdapter } from "@adapters/settings/PreloadFileSystemAdapter.js";
import { PreloadSecretStorageAdapter } from "@adapters/secrets/PreloadSecretStorageAdapter.js";
import { parseProfilesStorageRootResponse } from "@shared/ipc/ProfilesStorageContract.js";

/**
 * - Purpose: resolve disk bootstrap options for real adapter mode in renderer.
 * - Inputs: adapter mode and optional preload profiles persistence API.
 * - Outputs: profiles storage root and filesystem port for real bootstrap wiring.
 */
export async function resolveRealBootstrapDiskOptions(
  adapterMode: AdapterMode,
): Promise<Partial<CreateAccountBootstrapOptions>> {
  if (adapterMode !== "real") {
    return {};
  }

  const softphone = window.softphone;
  if (softphone?.getProfilesStorageRoot === undefined) {
    return {};
  }

  const response = parseProfilesStorageRootResponse(await softphone.getProfilesStorageRoot());
  if (response === null) {
    return {};
  }

  return {
    profilesStorageRoot: response.storageRoot,
    filesystem: new PreloadFileSystemAdapter((operation) =>
      softphone.invokeProfilesFilesystem(operation),
    ),
    secretStoragePort: new PreloadSecretStorageAdapter((operation) =>
      softphone.invokeSecretStorage(operation),
    ),
  };
}
