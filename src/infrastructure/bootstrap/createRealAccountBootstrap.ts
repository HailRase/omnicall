import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { resolveSettingsAccountKey } from "@application/settings/resolveSettingsAccountKey.js";
import {
  ArbiterMediaGateway,
  BrowserLocalMediaCaptureAdapter,
  BrowserMediaAdapter,
  MockHostIntegrationGateway,
  JsSipTelephonyAdapter,
  SettingsRepositoryCodecPreferencesAdapter,
} from "@adapters/index.js";
import { OcpWebSocketAdapter } from "@adapters/integration/ocp/OcpWebSocketAdapter.js";
import { LocalStorageOcpReasonsCache } from "@adapters/integration/ocp/LocalStorageOcpReasonsCache.js";
import { CallbackOcpNotificationPresenter } from "@adapters/integration/ocp/CallbackOcpNotificationPresenter.js";
import { OcpProxyAuthenticateHttpAdapter } from "@adapters/integration/ocp/OcpProxyAuthenticateHttpAdapter.js";
import { createConsoleLogger } from "@infrastructure/logging/index.js";
import type { Logger } from "@ports/index.js";
import type { LogContext } from "@ports/index.js";
import type { CreateAccountBootstrapOptions } from "./createMockAccountBootstrap.js";
import { createHeadsetGateway } from "./createHeadsetGateway.js";
import { createExternalServicesCompositionForBootstrap } from "./createExternalServicesCompositionForBootstrap.js";
import { createExternalApplicationsCompositionForBootstrap } from "./createExternalApplicationsCompositionForBootstrap.js";
import { createRealBootstrapSettingsRepository } from "./createRealBootstrapSettingsRepository.js";
import { createRealBootstrapSavedAccountProfileRepository } from "./createRealBootstrapSavedAccountProfileRepository.js";
import { createRealBootstrapContactRepository } from "./createRealBootstrapContactRepository.js";
import { createRealBootstrapCallHistoryRepository } from "./createRealBootstrapCallHistoryRepository.js";
import { FileUserNotificationJournalRepository } from "@adapters/settings/FileUserNotificationJournalRepository.js";
import type {
  CallHistoryRepository,
  ContactRepository,
  SavedAccountProfileRepository,
  UserNotificationJournalRepository,
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

function resolveRealNotificationJournalRepository(
  options: CreateAccountBootstrapOptions,
): UserNotificationJournalRepository | undefined {
  if (options.userNotificationJournalRepository !== undefined) {
    return options.userNotificationJournalRepository;
  }
  if (
    options.profilesStorageRoot === undefined ||
    options.filesystem === undefined
  ) {
    return undefined;
  }
  return new FileUserNotificationJournalRepository({
    storageRoot: options.profilesStorageRoot,
    filesystem: options.filesystem,
    logger: createBootstrapLogger({
      featureId: "F-029",
      boundedContext: "Settings",
    }),
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
  const userNotificationJournalRepository =
    resolveRealNotificationJournalRepository(options);
  const codecPreferencesPort = new SettingsRepositoryCodecPreferencesAdapter({
    settingsRepository,
    resolveAccountKey: () => resolveSettingsAccountKey(settingsRepository),
  });

  let telephonyGateway: JsSipTelephonyAdapter | null = null;
  const localMediaCapture = new BrowserLocalMediaCaptureAdapter({
    logger: createBootstrapLogger({ featureId: "F-027", boundedContext: "Media" }),
    getPeerConnection: (callId) =>
      telephonyGateway?.getPeerConnectionForCall(callId) ?? null,
  });
  const configuredTelephonyGateway = new JsSipTelephonyAdapter({
    logger: createBootstrapLogger({ featureId: "F-001", boundedContext: "Telephony" }),
    codecPreferencesPort,
    localMediaCapturePort: localMediaCapture,
    resolveLocalMediaStream: (handle) =>
      localMediaCapture.getStreamForHandle(handle),
    getPreferredMediaDeviceIds: async () => {
      const accountKey = await resolveSettingsAccountKey(settingsRepository);
      const settings = await settingsRepository.getUserSettings(accountKey);
      return {
        ...(settings.preferredAudioInputDeviceId !== null
          ? { audioDeviceId: settings.preferredAudioInputDeviceId }
          : {}),
        ...(settings.preferredVideoInputDeviceId !== null
          ? { videoDeviceId: settings.preferredVideoInputDeviceId }
          : {}),
      };
    },
  });
  telephonyGateway = configuredTelephonyGateway;
  let facadeRef: AccountBootstrapFacade | null = null;
  const mediaGateway = new ArbiterMediaGateway(
    new BrowserMediaAdapter({
      logger: createBootstrapLogger({ featureId: "F-005", boundedContext: "Media" }),
      getPeerConnection: (callId) =>
        configuredTelephonyGateway.getPeerConnectionForCall(callId),
      getLocalVideoStream: (callId) => localMediaCapture.getStreamForCall(callId),
      onRemoteVideoTracksChanged: (callId, present) => {
        facadeRef?.notifyRemoteVideoPresenceFromMedia(callId, present);
      },
    }),
  );
  const hostIntegrationGateway = new MockHostIntegrationGateway();
  const headsetGateway = createHeadsetGateway("webhid");
  const ocpGateway =
    options.ocpGateway ??
    new OcpWebSocketAdapter({
      logger: createBootstrapLogger({ featureId: "F-028", boundedContext: "Integration" }),
    });
  const ocpReasonsCache =
    options.ocpReasonsCache ??
    (typeof localStorage === "undefined"
      ? undefined
      : new LocalStorageOcpReasonsCache(localStorage));
  const ocpNotificationPresenter =
    options.ocpNotificationPresenter ?? new CallbackOcpNotificationPresenter();
  const ocpProxyAuthenticate =
    options.ocpProxyAuthenticate ??
    new OcpProxyAuthenticateHttpAdapter({
      logger: createBootstrapLogger({ featureId: "F-028", boundedContext: "Integration" }),
    });

  const externalServicesComposition =
    options.externalServicesComposition ??
    createExternalServicesCompositionForBootstrap({
      mode: "real",
      logger: createBootstrapLogger({ featureId: "F-031", boundedContext: "Integration" }),
      settingsRepository,
      ...(options.profilesStorageRoot !== undefined
        ? { profilesStorageRoot: options.profilesStorageRoot }
        : {}),
      ...(options.filesystem !== undefined ? { filesystem: options.filesystem } : {}),
      ...(options.outboundHttp !== undefined
        ? { outboundHttp: options.outboundHttp }
        : {}),
      ...(options.externalServicesJournalRepository !== undefined
        ? { journalRepository: options.externalServicesJournalRepository }
        : {}),
      ...(options.externalServicesClock !== undefined
        ? { clock: options.externalServicesClock }
        : {}),
      ...(options.externalServicesUuidGenerator !== undefined
        ? { uuidGenerator: options.externalServicesUuidGenerator }
        : {}),
    });

  const externalApplicationsComposition =
    options.externalApplicationsComposition ??
    createExternalApplicationsCompositionForBootstrap({
      mode: "real",
      logger: createBootstrapLogger({ featureId: "F-032", boundedContext: "Integration" }),
      settingsRepository,
      ...(options.profilesStorageRoot !== undefined
        ? { profilesStorageRoot: options.profilesStorageRoot }
        : {}),
      ...(options.filesystem !== undefined ? { filesystem: options.filesystem } : {}),
    });

  const facade = new AccountBootstrapFacade({
    telephonyGateway: configuredTelephonyGateway,
    mediaGateway,
    settingsRepository,
    localMediaCapturePort: localMediaCapture,
    headsetGateway,
    ocpGateway,
    ocpProxyAuthenticate,
    ...(ocpReasonsCache !== undefined ? { ocpReasonsCache } : {}),
    ocpNotificationPresenter,
    ...(savedAccountProfileRepository !== undefined
      ? { savedAccountProfileRepository }
      : {}),
    ...(contactRepository !== undefined ? { contactRepository } : {}),
    ...(callHistoryRepository !== undefined ? { callHistoryRepository } : {}),
    ...(userNotificationJournalRepository !== undefined
      ? { userNotificationJournalRepository }
      : {}),
    ...(options.contactCsvFileGateway !== undefined
      ? { contactCsvFileGateway: options.contactCsvFileGateway }
      : {}),
    ...(options.preferencesFileGateway !== undefined
      ? { preferencesFileGateway: options.preferencesFileGateway }
      : {}),
    ...(options.externalServicesCollectionFileGateway !== undefined
      ? {
          externalServicesCollectionFileGateway:
            options.externalServicesCollectionFileGateway,
        }
      : {}),
    ...(options.secretStoragePort !== undefined
      ? { secretStoragePort: options.secretStoragePort }
      : {}),
    externalServicesComposition,
    externalApplicationsComposition,
    hostIntegrationGateway,
    logger: createBootstrapLogger({ featureId: "F-001", boundedContext: "Telephony" }),
  });
  facadeRef = facade;

  configuredTelephonyGateway.setPeerConnectionBoundHandler(async (notification) => {
    await facade.notifyPeerConnectionAvailable(
      notification.callId,
      notification.correlationId,
    );
  });

  return facade;
}
