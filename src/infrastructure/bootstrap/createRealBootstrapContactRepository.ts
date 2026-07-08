import { FileContactRepository } from "@adapters/settings/FileContactRepository.js";
import { resolveSettingsAccountKey } from "@application/settings/resolveSettingsAccountKey.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { ContactRepository, SettingsRepository } from "@ports/index.js";

export type CreateRealBootstrapContactRepositoryInput = Readonly<{
  profilesStorageRoot: string;
  filesystem: FileSystemPort;
  settingsRepository: SettingsRepository;
  logger?: Logger;
}>;

/**
 * - Purpose: wire FileContactRepository for real bootstrap composition.
 * - Inputs: profiles storage root, filesystem port, settings repository for account key.
 * - Outputs: disk-backed ContactRepository scoped to active SettingsAccountKey.
 */
export function createRealBootstrapContactRepository(
  input: CreateRealBootstrapContactRepositoryInput,
): ContactRepository {
  return new FileContactRepository({
    storageRoot: input.profilesStorageRoot,
    filesystem: input.filesystem,
    resolveAccountKey: () => resolveSettingsAccountKey(input.settingsRepository),
    ...(input.logger !== undefined ? { logger: input.logger } : {}),
  });
}
