import { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  MockHostIntegrationGateway,
  MockMediaGateway,
  MockOperatorPlatformGateway,
  MockTelephonyGateway,
  InMemorySettingsRepository,
  createArbiterMediaGateway,
} from "@adapters/index.js";
import { createTestLogger } from "@infrastructure/logging/index.js";
import type { AppBootstrapConfig } from "@domain/index.js";
import type { FileSystemPort } from "@ports/filesystem/FileSystemPort.js";
import type {
  SettingsRepository,
  SavedAccountProfileRepository,
  CallHistoryRepository,
  ContactRepository,
  ContactCsvFileGateway,
} from "@ports/index.js";
import { wireOcpInboundToFacade } from "./wireOcpInboundToFacade.js";

/**
 * - Purpose: compose mock-based AccountBootstrapFacade for dev, tests, and renderer bootstrap.
 * - Inputs: optional bootstrap config and mock adapter scenario overrides.
 * - Outputs: wired AccountBootstrapFacade ready for initialize().
 */
export type CreateAccountBootstrapOptions = Readonly<{
  bootstrapConfig?: AppBootstrapConfig;
  profilesStorageRoot?: string;
  filesystem?: FileSystemPort;
  settingsRepository?: SettingsRepository;
  savedAccountProfileRepository?: SavedAccountProfileRepository;
  contactRepository?: ContactRepository;
  contactCsvFileGateway?: ContactCsvFileGateway;
  callHistoryRepository?: CallHistoryRepository;
  ocpWsUrl?: string;
  ocpScenario?:
    | "success"
    | "session_exists"
    | "invalid_token"
    | "access_denied"
    | "network_error";
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
    bootstrapConfig: options.bootstrapConfig ?? { mode: "sip-only" },
  });

  const operatorGateway = new MockOperatorPlatformGateway({
    scenario: options.ocpScenario ?? "success",
    delayMs: 300,
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

  const facade = new AccountBootstrapFacade({
    operatorGateway,
    telephonyGateway,
    mediaGateway,
    settingsRepository,
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
    hostIntegrationGateway,
    logger: createTestLogger({ featureId: "F-001", boundedContext: "Telephony" }),
  });

  wireOcpInboundToFacade(facade, operatorGateway);

  return facade;
}
