/**
 * - Purpose: compose mock-based AccountBootstrapFacade for dev, tests, and renderer bootstrap.
 * - Inputs: optional bootstrap config and mock adapter scenario overrides.
 * - Outputs: wired AccountBootstrapFacade ready for initialize().
 */

import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  MockHostIntegrationGateway,
  MockMediaGateway,
  MockTelephonyGateway,
  InMemorySettingsRepository,
  createArbiterMediaGateway,
} from "@adapters/index.js";
import { MockOcpGateway } from "@adapters/mock/MockOcpGateway.js";
import { InMemoryOcpReasonsCache } from "@adapters/mock/InMemoryOcpReasonsCache.js";
import { CallbackOcpNotificationPresenter } from "@adapters/integration/ocp/CallbackOcpNotificationPresenter.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import type { AppBootstrapConfig } from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type {
  SettingsRepository,
  SavedAccountProfileRepository,
  CallHistoryRepository,
  ContactRepository,
  ContactCsvFileGateway,
  PreferencesFileGateway,
  ExternalServicesCollectionFileGateway,
  SecretStoragePort,
  OcpGateway,
  OcpProxyAuthenticatePort,
  OcpReasonsCachePort,
  OcpNotificationPresenter,
  UserNotificationJournalRepository,
} from "@ports/index.js";
import { createHeadsetGateway } from "./createHeadsetGateway.js";
import { createExternalServicesCompositionForBootstrap } from "./createExternalServicesCompositionForBootstrap.js";
import { createExternalApplicationsCompositionForBootstrap } from "./createExternalApplicationsCompositionForBootstrap.js";
import type { ExternalServicesComposition } from "@application/services/integration/external-services/ExternalServicesComposition.js";
import type { ExternalApplicationsComposition } from "@application/services/integration/external-applications/ExternalApplicationsComposition.js";
import type { Clock, OutboundHttpPort, UuidGenerator } from "@ports/index.js";
import type { ExternalServicesJournalRepository } from "@ports/integration/ExternalServicesJournalRepository.js";

export type CreateAccountBootstrapOptions = Readonly<{
  bootstrapConfig?: AppBootstrapConfig;
  profilesStorageRoot?: string;
  filesystem?: FileSystemPort;
  settingsRepository?: SettingsRepository;
  savedAccountProfileRepository?: SavedAccountProfileRepository;
  contactRepository?: ContactRepository;
  contactCsvFileGateway?: ContactCsvFileGateway;
  preferencesFileGateway?: PreferencesFileGateway;
  externalServicesCollectionFileGateway?: ExternalServicesCollectionFileGateway;
  callHistoryRepository?: CallHistoryRepository;
  secretStoragePort?: SecretStoragePort;
  userNotificationJournalRepository?: UserNotificationJournalRepository;
  ocpGateway?: OcpGateway;
  ocpProxyAuthenticate?: OcpProxyAuthenticatePort;
  ocpReasonsCache?: OcpReasonsCachePort;
  ocpNotificationPresenter?: OcpNotificationPresenter;
  outboundHttp?: OutboundHttpPort;
  externalServicesJournalRepository?: ExternalServicesJournalRepository;
  externalServicesClock?: Clock;
  externalServicesUuidGenerator?: UuidGenerator;
  externalServicesComposition?: ExternalServicesComposition;
  externalApplicationsComposition?: ExternalApplicationsComposition;
  telephonyScenario?: "success" | "failure";
  makeCallScenario?:
    | "connecting"
    | "progress_180"
    | "progress_183"
    | "answered"
    | "failed_busy"
    | "failed_rejected"
    | "failed_unavailable";
  dtmfScenario?: "success" | "failure";
  incomingAnswerScenario?: "success" | "failure";
  incomingRejectScenario?: "success" | "failure";
  holdScenario?: "success" | "failure";
  resumeScenario?: "success" | "failure";
  hangupScenario?: "success" | "failure";
  mediaScenario?: "success" | "failure";
}>;

export function createMockAccountBootstrap(
  options: CreateAccountBootstrapOptions = {},
): AccountBootstrapFacade {
  const settingsRepository = options.settingsRepository ?? new InMemorySettingsRepository({
    bootstrapConfig: options.bootstrapConfig ?? {},
  });

  const telephonyGateway = new MockTelephonyGateway({
    registrationScenario: options.telephonyScenario ?? "success",
    makeCallScenario: options.makeCallScenario ?? "answered",
    dtmfScenario: options.dtmfScenario ?? "success",
    incomingAnswerScenario: options.incomingAnswerScenario ?? "success",
    incomingRejectScenario: options.incomingRejectScenario ?? "success",
    holdScenario: options.holdScenario ?? "success",
    resumeScenario: options.resumeScenario ?? "success",
    hangupScenario: options.hangupScenario ?? "success",
    delayMs: 200,
  });
  const mediaGateway = createArbiterMediaGateway(
    new MockMediaGateway(options.mediaScenario ?? "success"),
  );
  const hostIntegrationGateway = new MockHostIntegrationGateway();
  const logger = createTestLogger({ featureId: "F-001", boundedContext: "Telephony" });
  const externalServicesComposition =
    options.externalServicesComposition ??
    createExternalServicesCompositionForBootstrap({
      mode: "mock",
      logger: createTestLogger({ featureId: "F-031", boundedContext: "Integration" }),
      settingsRepository,
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
      mode: "mock",
      logger: createTestLogger({ featureId: "F-032", boundedContext: "Integration" }),
      settingsRepository,
    });

  return new AccountBootstrapFacade({
    telephonyGateway,
    mediaGateway,
    settingsRepository,
    headsetGateway: createHeadsetGateway("mock"),
    ocpGateway: options.ocpGateway ?? new MockOcpGateway(),
    ocpReasonsCache: options.ocpReasonsCache ?? new InMemoryOcpReasonsCache(),
    ocpNotificationPresenter:
      options.ocpNotificationPresenter ?? new CallbackOcpNotificationPresenter(),
    ...(options.savedAccountProfileRepository !== undefined
      ? { savedAccountProfileRepository: options.savedAccountProfileRepository }
      : {}),
    ...(options.contactRepository !== undefined
      ? { contactRepository: options.contactRepository }
      : {}),
    ...(options.callHistoryRepository !== undefined
      ? { callHistoryRepository: options.callHistoryRepository }
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
    ...(options.userNotificationJournalRepository !== undefined
      ? {
          userNotificationJournalRepository:
            options.userNotificationJournalRepository,
        }
      : {}),
    externalServicesComposition,
    externalApplicationsComposition,
    hostIntegrationGateway,
    logger,
  });
}
