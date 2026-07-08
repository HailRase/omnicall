import { FileCallHistoryRepository } from "@adapters/settings/FileCallHistoryRepository.js";
import { resolveSettingsAccountKey } from "@application/settings/resolveSettingsAccountKey.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { CallHistoryRepository, SettingsRepository } from "@ports/index.js";

export type CreateRealBootstrapCallHistoryRepositoryInput = Readonly<{
  profilesStorageRoot: string;
  filesystem: FileSystemPort;
  settingsRepository: SettingsRepository;
  logger?: Logger;
}>;

/**
 * - Purpose: wire FileCallHistoryRepository for real bootstrap composition.
 * - Inputs: profiles storage root, filesystem port, settings repository for account key.
 * - Outputs: disk-backed CallHistoryRepository scoped to active SettingsAccountKey.
 */
export function createRealBootstrapCallHistoryRepository(
  input: CreateRealBootstrapCallHistoryRepositoryInput,
): CallHistoryRepository {
  return new FileCallHistoryRepository({
    storageRoot: input.profilesStorageRoot,
    filesystem: input.filesystem,
    resolveAccountKey: () => resolveSettingsAccountKey(input.settingsRepository),
    ...(input.logger !== undefined ? { logger: input.logger } : {}),
  });
}
