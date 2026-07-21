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
  pendingOriginTrust: [],
  profileOptions: [],
  selectedClientId: null,
  selectedProfileId: null,
  lastGrant: null,
  addOriginDraft: "",
  errorKey: null,
  busy: false,
  onAddOriginDraftChange: vi.fn(),
  onAddOrigin: vi.fn(),
  onRefresh: vi.fn(),
  onApprovePairing: vi.fn(),
  onDenyPairing: vi.fn(),
  onRevokeClient: vi.fn(),
  onSelectClientId: vi.fn(),
  onSelectProfileId: vi.fn(),
  onIssueActivateGrant: vi.fn(),
  onAllowOriginTrust: vi.fn(),
  onDenyOriginTrust: vi.fn(),
  onUnblockOrigin: vi.fn(),
  onBlacklistOrigin: vi.fn(),
  onRemoveAllowedOrigin: vi.fn(),
  onRenameAllowedOrigin: vi.fn(),
  onSetOriginMatrix: vi.fn(),
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
      onDomainChange: () => undefined,
      onAutoConnectChange: () => undefined,
    } satisfies OcpModuleSettingsCardProps,
    sdk: {
      ...sdkCardDefaults,
      onAddOriginDraftChange: () => undefined,
      onAddOrigin: () => undefined,
      onRefresh: () => undefined,
      onApprovePairing: () => undefined,
      onDenyPairing: () => undefined,
      onRevokeClient: () => undefined,
      onSelectClientId: () => undefined,
      onSelectProfileId: () => undefined,
      onIssueActivateGrant: () => undefined,
      onAllowOriginTrust: () => undefined,
      onDenyOriginTrust: () => undefined,
      onUnblockOrigin: () => undefined,
      onBlacklistOrigin: () => undefined,
      onRemoveAllowedOrigin: () => undefined,
      onRenameAllowedOrigin: () => undefined,
      onSetOriginMatrix: () => undefined,
    } satisfies SdkModuleSettingsCardProps,
  },
} as const;
