import { OCP_INTEGRATION_DEFAULTS, SDK_INTEGRATION_DEFAULTS } from "@application/index.js";
import { vi } from "vitest";
import type { OcpModuleSettingsCardProps } from "./OcpModuleSettingsCard.js";
import type { SdkModuleSettingsCardProps } from "./SdkModuleSettingsCard.js";
import type { ExternalServicesPanelProps } from "../external-services/ExternalServicesPanel.js";

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
    windowHideAvailable: true,
  },
  allowedOriginsLive: [],
  pairedClients: [],
  addOriginDraft: "",
  errorKey: null,
  busy: false,
  onAddOriginDraftChange: vi.fn(),
  onAddOrigin: vi.fn(),
  onRefresh: vi.fn(),
  onRevokeClient: vi.fn(),
  onUnblockOrigin: vi.fn(),
  onBlacklistOrigin: vi.fn(),
  onRemoveAllowedOrigin: vi.fn(),
  onRenameAllowedOrigin: vi.fn(),
  onSetOriginMatrix: vi.fn(),
  onOperatorModalTimeoutsChange: vi.fn(),
} satisfies SdkModuleSettingsCardProps;

const externalServicesCollectionsDefaults = {
  collections: [],
  loadState: "ready" as const,
  busy: false,
  errorMessage: null,
  statusMessage: null,
  nameDialog: {
    open: false,
    mode: "create" as const,
    value: "",
    errorMessage: null,
  },
  deleteDialog: {
    open: false,
    collectionName: "",
  },
  onRetry: vi.fn(),
  onCreate: vi.fn(),
  onImport: vi.fn(),
  onOpenCollection: vi.fn(),
  onToggleCollection: vi.fn(),
  onRenameCollection: vi.fn(),
  onDuplicateCollection: vi.fn(),
  onExportCollection: vi.fn(),
  onEditVariables: vi.fn(),
  onDeleteCollection: vi.fn(),
  onNameDialogOpenChange: vi.fn(),
  onNameDialogValueChange: vi.fn(),
  onNameDialogSubmit: vi.fn(),
  onDeleteDialogOpenChange: vi.fn(),
  onDeleteDialogConfirm: vi.fn(),
  journal: {
    panel: { loadState: "ready" as const, entries: [], capped: false },
    onRetry: vi.fn(),
  },
};

const externalServicesDefaults = {
  collectionsView: externalServicesCollectionsDefaults,
  variablesDialog: null,
} satisfies ExternalServicesPanelProps;

export const settingsIntegrationsTestDefaults = {
  integrations: {
    ocp: ocpCardDefaults,
    sdk: sdkCardDefaults,
    externalServices: externalServicesDefaults,
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
      onRevokeClient: () => undefined,
      onUnblockOrigin: () => undefined,
      onBlacklistOrigin: () => undefined,
      onRemoveAllowedOrigin: () => undefined,
      onRenameAllowedOrigin: () => undefined,
      onSetOriginMatrix: () => undefined,
      onOperatorModalTimeoutsChange: () => undefined,
    } satisfies SdkModuleSettingsCardProps,
    externalServices: {
      collectionsView: {
        ...externalServicesCollectionsDefaults,
        onRetry: () => undefined,
        onCreate: () => undefined,
        onImport: () => undefined,
        onOpenCollection: () => undefined,
        onToggleCollection: () => undefined,
        onRenameCollection: () => undefined,
        onDuplicateCollection: () => undefined,
        onExportCollection: () => undefined,
        onEditVariables: () => undefined,
        onDeleteCollection: () => undefined,
        onNameDialogOpenChange: () => undefined,
        onNameDialogValueChange: () => undefined,
        onNameDialogSubmit: () => undefined,
        onDeleteDialogOpenChange: () => undefined,
        onDeleteDialogConfirm: () => undefined,
        journal: {
          panel: { loadState: "ready", entries: [], capped: false },
          onRetry: () => undefined,
        },
      },
      variablesDialog: null,
    } satisfies ExternalServicesPanelProps,
  },
} as const;
