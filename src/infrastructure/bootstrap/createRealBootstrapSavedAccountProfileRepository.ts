import { FileSavedAccountProfileRepository } from "@adapters/settings/FileSavedAccountProfileRepository.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { Logger } from "@ports/logging/Logger.js";
import type { SavedAccountProfileRepository } from "@ports/index.js";

export type CreateRealBootstrapSavedAccountProfileRepositoryInput = Readonly<{
  profilesStorageRoot: string;
  filesystem: FileSystemPort;
  logger?: Logger;
}>;

/**
 * - Purpose: wire FileSavedAccountProfileRepository for real bootstrap composition.
 * - Inputs: profiles storage root, filesystem port, optional logger.
 * - Outputs: disk-backed SavedAccountProfileRepository separate from user settings.
 */
export function createRealBootstrapSavedAccountProfileRepository(
  input: CreateRealBootstrapSavedAccountProfileRepositoryInput,
): SavedAccountProfileRepository {
  return new FileSavedAccountProfileRepository({
    storageRoot: input.profilesStorageRoot,
    filesystem: input.filesystem,
    ...(input.logger !== undefined ? { logger: input.logger } : {}),
  });
}
