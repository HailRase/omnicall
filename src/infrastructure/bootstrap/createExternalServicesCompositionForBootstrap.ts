/**
 * - Purpose: wire External Services runtime into mock/real account bootstrap.
 * - Inputs: adapter mode and optional port overrides for tests.
 * - Outputs: composed automation runtime with dispose cleanup.
 */

import {
  createExternalServicesComposition,
  type ExternalServicesComposition,
} from "@application/services/integration/external-services/ExternalServicesComposition.js";
import { InMemoryExternalServicesJournalRepository } from "@adapters/mock/InMemoryExternalServicesJournalRepository.js";
import { MockOutboundHttpAdapter } from "@adapters/mock/MockOutboundHttpAdapter.js";
import { CryptoUuidGenerator } from "@adapters/platform/CryptoUuidGenerator.js";
import { PreloadOutboundHttpAdapter } from "@adapters/platform/PreloadOutboundHttpAdapter.js";
import { SystemClock } from "@adapters/platform/SystemClock.js";
import { FileExternalServicesJournalRepository } from "@adapters/settings/FileExternalServicesJournalRepository.js";
import type {
  Clock,
  Logger,
  OutboundHttpPort,
  SettingsRepository,
  UuidGenerator,
} from "@ports/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type { ExternalServicesJournalRepository } from "@ports/integration/ExternalServicesJournalRepository.js";
import type { AdapterMode } from "./adapterMode.js";

export type CreateExternalServicesCompositionForBootstrapOptions = Readonly<{
  mode: AdapterMode;
  logger: Logger;
  outboundHttp?: OutboundHttpPort;
  journalRepository?: ExternalServicesJournalRepository;
  settingsRepository?: SettingsRepository;
  clock?: Clock;
  uuidGenerator?: UuidGenerator;
  profilesStorageRoot?: string;
  filesystem?: FileSystemPort;
}>;

export function createExternalServicesCompositionForBootstrap(
  options: CreateExternalServicesCompositionForBootstrapOptions,
): ExternalServicesComposition {
  const outboundHttp =
    options.outboundHttp ??
    (options.mode === "real"
      ? new PreloadOutboundHttpAdapter()
      : new MockOutboundHttpAdapter());
  const journalRepository =
    options.journalRepository ??
    resolveJournalRepository(options);
  return createExternalServicesComposition({
    outboundHttp,
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
  options: CreateExternalServicesCompositionForBootstrapOptions,
): ExternalServicesJournalRepository {
  if (
    options.mode === "real" &&
    options.profilesStorageRoot !== undefined &&
    options.filesystem !== undefined
  ) {
    return new FileExternalServicesJournalRepository({
      storageRoot: options.profilesStorageRoot,
      filesystem: options.filesystem,
      logger: options.logger,
    });
  }
  return new InMemoryExternalServicesJournalRepository();
}
