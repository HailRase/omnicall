import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { resolveSettingsAccountKey } from "@application/settings/resolveSettingsAccountKey.js";
import {
  ArbiterMediaGateway,
  BrowserMediaAdapter,
  MockHostIntegrationGateway,
  JsSipTelephonyAdapter,
  SettingsRepositoryCodecPreferencesAdapter,
} from "@adapters/index.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import type { Logger } from "@ports/index.js";
import type { LogContext } from "@ports/index.js";
import type { CreateAccountBootstrapOptions } from "./createMockAccountBootstrap.js";
import { createRealBootstrapSettingsRepository } from "./createRealBootstrapSettingsRepository.js";
import { createRealBootstrapSavedAccountProfileRepository } from "./createRealBootstrapSavedAccountProfileRepository.js";
import { createRealBootstrapContactRepository } from "./createRealBootstrapContactRepository.js";
import { createRealBootstrapCallHistoryRepository } from "./createRealBootstrapCallHistoryRepository.js";
import type {
  CallHistoryRepository,
  ContactRepository,
  SavedAccountProfileRepository,
} from "@ports/index.js";

function createBootstrapLogger(context: LogContext): Logger {
  return createConsoleLogger(context);
}

function resolveRealContactRepository(
  options: CreateAccountBootstrapOptions,
  settingsRepository: ReturnType<typeof resolveRealSettingsRepository>,
): ContactRepository | undefined {
  if (options.contactRepository !== undefined) {
    return options.contactRepository;
  }

  if (options.profilesStorageRoot === undefined || options.filesystem === undefined) {
    return undefined;
  }

  return createRealBootstrapContactRepository({
    profilesStorageRoot: options.profilesStorageRoot,
    filesystem: options.filesystem,
    settingsRepository,
    logger: createBootstrapLogger({ featureId: "F-025", boundedContext: "Settings" }),
  });
}

function resolveRealCallHistoryRepository(
  options: CreateAccountBootstrapOptions,
  settingsRepository: ReturnType<typeof resolveRealSettingsRepository>,
): CallHistoryRepository | undefined {
  if (options.callHistoryRepository !== undefined) {
    return options.callHistoryRepository;
  }

  if (options.profilesStorageRoot === undefined || options.filesystem === undefined) {
    return undefined;
  }

  return createRealBootstrapCallHistoryRepository({
    profilesStorageRoot: options.profilesStorageRoot,
    filesystem: options.filesystem,
    settingsRepository,
    logger: createBootstrapLogger({ featureId: "F-013", boundedContext: "Settings" }),
  });
}

function resolveRealSavedAccountProfileRepository(
  options: CreateAccountBootstrapOptions,
): SavedAccountProfileRepository | undefined {
  if (options.savedAccountProfileRepository !== undefined) {
    return options.savedAccountProfileRepository;
  }

  if (options.profilesStorageRoot === undefined || options.filesystem === undefined) {
    return undefined;
  }

  return createRealBootstrapSavedAccountProfileRepository({
    profilesStorageRoot: options.profilesStorageRoot,
    filesystem: options.filesystem,
    logger: createBootstrapLogger({ featureId: "F-024", boundedContext: "Settings" }),
  });
}

function resolveRealSettingsRepository(options: CreateAccountBootstrapOptions) {
  if (options.settingsRepository !== undefined) {
    return options.settingsRepository;
  }

  if (options.profilesStorageRoot === undefined) {
    throw new Error("real_bootstrap_requires_profiles_storage_root");
  }

  if (options.filesystem === undefined) {
    throw new Error("real_bootstrap_requires_filesystem_port");
  }

  return createRealBootstrapSettingsRepository({
    profilesStorageRoot: options.profilesStorageRoot,
    filesystem: options.filesystem,
    bootstrapConfig: options.bootstrapConfig ?? {},
  });
}

/**
 * - Purpose: compose real-adapter AccountBootstrapFacade with JsSIP telephony.
 * - Inputs: bootstrap config, profiles storage root, optional filesystem port.
 * - Outputs: wired AccountBootstrapFacade with disk-backed settings ready for initialize().
 */
export function createRealAccountBootstrap(
  options: CreateAccountBootstrapOptions = {},
): AccountBootstrapFacade {
  const settingsRepository = resolveRealSettingsRepository(options);
  const savedAccountProfileRepository = resolveRealSavedAccountProfileRepository(options);
  const contactRepository = resolveRealContactRepository(options, settingsRepository);
  const callHistoryRepository = resolveRealCallHistoryRepository(options, settingsRepository);
  const codecPreferencesPort = new SettingsRepositoryCodecPreferencesAdapter({
    settingsRepository,
    resolveAccountKey: () => resolveSettingsAccountKey(settingsRepository),
  });

  const telephonyGateway = new JsSipTelephonyAdapter({
    logger: createBootstrapLogger({ featureId: "F-001", boundedContext: "Telephony" }),
    codecPreferencesPort,
  });
  const mediaGateway = new ArbiterMediaGateway(
    new BrowserMediaAdapter({
      logger: createBootstrapLogger({ featureId: "F-005", boundedContext: "Media" }),
      getPeerConnection: (callId) => telephonyGateway.getPeerConnectionForCall(callId),
    }),
  );
  const hostIntegrationGateway = new MockHostIntegrationGateway();

  const facade = new AccountBootstrapFacade({
    telephonyGateway,
    mediaGateway,
    settingsRepository,
    ...(savedAccountProfileRepository !== undefined
      ? { savedAccountProfileRepository }
      : {}),
    ...(contactRepository !== undefined ? { contactRepository } : {}),
    ...(callHistoryRepository !== undefined ? { callHistoryRepository } : {}),
    ...(options.contactCsvFileGateway !== undefined
      ? { contactCsvFileGateway: options.contactCsvFileGateway }
      : {}),
    ...(options.secretStoragePort !== undefined
      ? { secretStoragePort: options.secretStoragePort }
      : {}),
    hostIntegrationGateway,
    logger: createBootstrapLogger({ featureId: "F-001", boundedContext: "Telephony" }),
  });

  telephonyGateway.setPeerConnectionBoundHandler(async (notification) => {
    await facade.notifyPeerConnectionAvailable(
      notification.callId,
      notification.correlationId,
    );
  });

  return facade;
}
