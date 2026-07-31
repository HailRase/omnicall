/**
 * - Purpose: wire External Applications runtime into mock/real account bootstrap.
 * - Inputs: adapter mode and optional port overrides for tests.
 * - Outputs: composed screen-pop runtime with dispose cleanup.
 */

import {
  createExternalApplicationsComposition,
  type ExternalApplicationsComposition,
} from "@application/services/integration/external-applications/ExternalApplicationsComposition.js";
import { MockExternalApplicationWindowGateway } from "@adapters/mock/MockExternalApplicationWindowGateway.js";
import { MockExternalUrlGateway } from "@adapters/mock/MockExternalUrlGateway.js";
import { CryptoUuidGenerator } from "@adapters/platform/CryptoUuidGenerator.js";
import { PreloadExternalApplicationWindowGateway } from "@adapters/platform/PreloadExternalApplicationWindowGateway.js";
import { PreloadExternalUrlGateway } from "@adapters/platform/PreloadExternalUrlGateway.js";
import { SystemClock } from "@adapters/platform/SystemClock.js";
import type {
  Clock,
  Logger,
  SettingsRepository,
  UuidGenerator,
} from "@ports/index.js";
import type { ExternalApplicationWindowGateway } from "@ports/integration/ExternalApplicationWindowGateway.js";
import type { ExternalUrlGateway } from "@ports/updates/ExternalUrlGateway.js";
import type { AdapterMode } from "./adapterMode.js";

export type CreateExternalApplicationsCompositionForBootstrapOptions = Readonly<{
  mode: AdapterMode;
  logger: Logger;
  windowGateway?: ExternalApplicationWindowGateway;
  externalUrlGateway?: ExternalUrlGateway;
  settingsRepository?: SettingsRepository;
  clock?: Clock;
  uuidGenerator?: UuidGenerator;
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
  return createExternalApplicationsComposition({
    windowGateway,
    externalUrlGateway,
    clock: options.clock ?? new SystemClock(),
    uuidGenerator: options.uuidGenerator ?? new CryptoUuidGenerator(),
    logger: options.logger,
    ...(options.settingsRepository !== undefined
      ? { settingsRepository: options.settingsRepository }
      : {}),
  });
}
