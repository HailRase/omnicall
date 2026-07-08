import { FileSettingsRepository } from "@adapters/settings/FileSettingsRepository.js";
import type { AppBootstrapConfig } from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { SettingsRepository } from "@ports/index.js";

export type CreateRealBootstrapSettingsRepositoryInput = Readonly<{
  profilesStorageRoot: string;
  filesystem: FileSystemPort;
  bootstrapConfig?: AppBootstrapConfig;
}>;

/**
 * - Purpose: wire FileSettingsRepository for real bootstrap composition.
 * - Inputs: profiles storage root, filesystem port, optional bootstrap seed.
 * - Outputs: SettingsRepository with disk persistence and in-memory session state.
 */
export function createRealBootstrapSettingsRepository(
  input: CreateRealBootstrapSettingsRepositoryInput,
): SettingsRepository {
  return new FileSettingsRepository({
    storageRoot: input.profilesStorageRoot,
    filesystem: input.filesystem,
    initial: {
      bootstrapConfig: input.bootstrapConfig ?? {},
    },
  });
}
