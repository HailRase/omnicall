import { OCP_INTEGRATION_DEFAULTS, SDK_INTEGRATION_DEFAULTS } from "@application/index.js";
import { vi } from "vitest";
import type { OcpModuleSettingsCardProps } from "./OcpModuleSettingsCard.js";
import type { SdkModuleSettingsCardProps } from "./SdkModuleSettingsCard.js";

const ocpCardDefaults = {
  settings: { ...OCP_INTEGRATION_DEFAULTS, linked: true, enabled: true, domain: "ocp.example" },
  activeLoginLabel: "agent-1",
  errorKey: null,
  configEditable: true,
  onEnabledChange: vi.fn(),
  onDomainChange: vi.fn(),
  onAutoConnectChange: vi.fn(),
} satisfies OcpModuleSettingsCardProps;

const sdkCardDefaults = {
  settings: { ...SDK_INTEGRATION_DEFAULTS },
  diagnostics: {
    status: "disabled",
    bindHost: null,
    bindPort: null,
    connectionCount: 0,
    authenticatedCount: 0,
    unauthenticatedCount: 0,
    pendingPairingCount: 0,
    pairedClientCount: 0,
    allowedOriginsCount: 0,
    lastErrorCode: null,
    windowHideAvailable: false,
  },
  allowedOriginsLive: [],
  pairedClients: [],
  pendingPairing: [],
  profileOptions: [],
  selectedClientId: null,
  selectedProfileId: null,
  lastGrant: null,
  originsDraft: "",
  errorKey: null,
  busy: false,
  onEnabledChange: vi.fn(),
  onOriginsDraftChange: vi.fn(),
  onOriginsSave: vi.fn(),
  onRefresh: vi.fn(),
  onApprovePairing: vi.fn(),
  onDenyPairing: vi.fn(),
  onRevokeClient: vi.fn(),
  onSelectClientId: vi.fn(),
  onSelectProfileId: vi.fn(),
  onIssueActivateGrant: vi.fn(),
} satisfies SdkModuleSettingsCardProps;

export const settingsIntegrationsTestDefaults = {
  integrations: {
    ocp: ocpCardDefaults,
    sdk: sdkCardDefaults,
  },
} as const;

export const settingsIntegrationsStoryDefaults = {
  integrations: {
    ocp: {
      ...ocpCardDefaults,
      onEnabledChange: () => undefined,
      onDomainChange: () => undefined,
      onAutoConnectChange: () => undefined,
    } satisfies OcpModuleSettingsCardProps,
    sdk: {
      ...sdkCardDefaults,
      onEnabledChange: () => undefined,
      onOriginsDraftChange: () => undefined,
      onOriginsSave: () => undefined,
      onRefresh: () => undefined,
      onApprovePairing: () => undefined,
      onDenyPairing: () => undefined,
      onRevokeClient: () => undefined,
      onSelectClientId: () => undefined,
      onSelectProfileId: () => undefined,
      onIssueActivateGrant: () => undefined,
    } satisfies SdkModuleSettingsCardProps,
  },
} as const;
