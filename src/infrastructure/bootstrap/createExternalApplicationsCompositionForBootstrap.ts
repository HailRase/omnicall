/**
 * - Purpose: wire External Applications runtime into mock/real account bootstrap.
 * - Inputs: adapter mode and optional port overrides for tests.
 * - Outputs: composed screen-pop runtime with dispose cleanup.
 */

import {
  createExternalApplicationsComposition,
  type ExternalApplicationsComposition,
} from "@application/services/integration/external-applications/ExternalApplicationsComposition.js";
import { InMemoryExternalApplicationsJournalRepository } from "@adapters/mock/InMemoryExternalApplicationsJournalRepository.js";
import { MockExternalApplicationWindowGateway } from "@adapters/mock/MockExternalApplicationWindowGateway.js";
import { MockExternalUrlGateway } from "@adapters/mock/MockExternalUrlGateway.js";
import { CryptoUuidGenerator } from "@adapters/platform/CryptoUuidGenerator.js";
import { PreloadExternalApplicationWindowGateway } from "@adapters/platform/PreloadExternalApplicationWindowGateway.js";
import { PreloadExternalUrlGateway } from "@adapters/platform/PreloadExternalUrlGateway.js";
import { SystemClock } from "@adapters/platform/SystemClock.js";
import { FileExternalApplicationsJournalRepository } from "@adapters/settings/FileExternalApplicationsJournalRepository.js";
import type {
  Clock,
  Logger,
  SettingsRepository,
  UuidGenerator,
} from "@ports/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { ExternalApplicationWindowGateway } from "@ports/integration/ExternalApplicationWindowGateway.js";
import type { ExternalApplicationsJournalRepository } from "@ports/integration/ExternalApplicationsJournalRepository.js";
import type { ExternalUrlGateway } from "@ports/updates/ExternalUrlGateway.js";
import type { AdapterMode } from "./adapterMode.js";

export type CreateExternalApplicationsCompositionForBootstrapOptions = Readonly<{
  mode: AdapterMode;
  logger: Logger;
  windowGateway?: ExternalApplicationWindowGateway;
  externalUrlGateway?: ExternalUrlGateway;
  journalRepository?: ExternalApplicationsJournalRepository;
  settingsRepository?: SettingsRepository;
  clock?: Clock;
  uuidGenerator?: UuidGenerator;
  profilesStorageRoot?: string;
  filesystem?: FileSystemPort;
}>;

export function createExternalApplicationsCompositionForBootstrap(
  options: CreateExternalApplicationsCompositionForBootstrapOptions,
): ExternalApplicationsComposition {
  const windowGateway =
    options.windowGateway ??
    (options.mode === "real"
      ? new PreloadExternalApplicationWindowGateway()
      : new MockExternalApplicationWindowGateway());
  const externalUrlGateway =
    options.externalUrlGateway ??
    (options.mode === "real"
      ? new PreloadExternalUrlGateway()
      : new MockExternalUrlGateway());
  const journalRepository =
    options.journalRepository ?? resolveJournalRepository(options);
  return createExternalApplicationsComposition({
    windowGateway,
    externalUrlGateway,
    journalRepository,
    clock: options.clock ?? new SystemClock(),
    uuidGenerator: options.uuidGenerator ?? new CryptoUuidGenerator(),
    logger: options.logger,
    ...(options.settingsRepository !== undefined
      ? { settingsRepository: options.settingsRepository }
      : {}),
  });
}

function resolveJournalRepository(
  options: CreateExternalApplicationsCompositionForBootstrapOptions,
): ExternalApplicationsJournalRepository {
  if (
    options.mode === "real" &&
    options.profilesStorageRoot !== undefined &&
    options.filesystem !== undefined
  ) {
    return new FileExternalApplicationsJournalRepository({
      storageRoot: options.profilesStorageRoot,
      filesystem: options.filesystem,
      logger: options.logger,
    });
  }
  return new InMemoryExternalApplicationsJournalRepository();
}
