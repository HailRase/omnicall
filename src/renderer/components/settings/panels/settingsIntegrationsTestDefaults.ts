import { vi } from "vitest";
import { OCP_INTEGRATION_DEFAULTS, SDK_INTEGRATION_DEFAULTS } from "@application/index.js";
import type { OcpModuleSettingsCardProps } from "./OcpModuleSettingsCard.js";
import type { SdkModuleSettingsCardProps } from "./SdkModuleSettingsCard.js";
import type { ExternalServicesPanelProps } from "../external-services/ExternalServicesPanel.js";
import type { ExternalApplicationsPanelProps } from "../external-applications/ExternalApplicationsPanel.js";

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

const journal = {
  panel: { loadState: "ready" as const, entries: [], capped: false },
  onRetry: vi.fn(),
};

const externalServicesDefaults = {
  sidebar: {
    collections: [],
    selection: { kind: "none" as const },
    busy: false,
    loadState: "ready" as const,
    onCreateCollection: vi.fn(),
    onImportCollection: vi.fn(),
    onSelectCollection: vi.fn(),
    onSelectRequest: vi.fn(),
    onCreateRequest: vi.fn(),
    onRenameCollection: vi.fn(),
    onDuplicateCollection: vi.fn(),
    onExportCollection: vi.fn(),
    onEditVariables: vi.fn(),
    onDeleteCollection: vi.fn(),
    onToggleRequest: vi.fn(),
    onRenameRequest: vi.fn(),
    onDuplicateRequest: vi.fn(),
    onDeleteRequest: vi.fn(),
  },
  welcome: { journal },
  requestsView: null,
  requestEditor: null,
  loadErrorMessage: null,
  statusMessage: null,
  onRetryLoad: vi.fn(),
  dialogs: {
    busy: false,
    nameDialog: {
      open: false,
      mode: "create" as const,
      scope: "collection" as const,
      value: "",
      errorMessage: null,
    },
    deleteDialog: {
      open: false,
      collectionName: "",
    },
    discardDialogOpen: false,
    onNameDialogOpenChange: vi.fn(),
    onNameDialogValueChange: vi.fn(),
    onNameDialogSubmit: vi.fn(),
    onDeleteDialogOpenChange: vi.fn(),
    onDeleteDialogConfirm: vi.fn(),
    onDiscardDialogOpenChange: vi.fn(),
    onDiscardConfirm: vi.fn(),
  },
  variablesDialog: null,
} satisfies ExternalServicesPanelProps;

const externalApplicationsDefaults = {
  applications: [],
  selectedApplication: null,
  selection: null,
  historyEntries: [],
  historyLoading: false,
  historyError: false,
  busy: false,
  loadError: false,
  forceNameEditKey: 0,
  onSelectApplication: vi.fn(),
  onSelectHistory: vi.fn(),
  onRetryHistory: vi.fn(),
  onCreate: vi.fn(),
  onToggle: vi.fn(),
  onRename: vi.fn(),
  onDuplicate: vi.fn(),
  onDelete: vi.fn(),
  onChange: vi.fn(),
  onSave: vi.fn(),
  onOpenNow: vi.fn(),
} satisfies ExternalApplicationsPanelProps;

export const settingsIntegrationsTestDefaults = {
  integrations: {
    ocp: ocpCardDefaults,
    sdk: sdkCardDefaults,
    externalServices: externalServicesDefaults,
    externalApplications: externalApplicationsDefaults,
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
      ...externalServicesDefaults,
      sidebar: {
        ...externalServicesDefaults.sidebar,
        onCreateCollection: () => undefined,
        onImportCollection: () => undefined,
        onSelectCollection: () => undefined,
        onSelectRequest: () => undefined,
        onCreateRequest: () => undefined,
        onRenameCollection: () => undefined,
        onDuplicateCollection: () => undefined,
        onExportCollection: () => undefined,
        onEditVariables: () => undefined,
        onDeleteCollection: () => undefined,
        onToggleRequest: () => undefined,
        onRenameRequest: () => undefined,
        onDuplicateRequest: () => undefined,
        onDeleteRequest: () => undefined,
      },
      welcome: {
        journal: {
          panel: { loadState: "ready", entries: [], capped: false },
          onRetry: () => undefined,
        },
      },
      loadErrorMessage: null,
      statusMessage: null,
      onRetryLoad: () => undefined,
      dialogs: {
        ...externalServicesDefaults.dialogs,
        onNameDialogOpenChange: () => undefined,
        onNameDialogValueChange: () => undefined,
        onNameDialogSubmit: () => undefined,
        onDeleteDialogOpenChange: () => undefined,
        onDeleteDialogConfirm: () => undefined,
        onDiscardDialogOpenChange: () => undefined,
        onDiscardConfirm: () => undefined,
      },
      variablesDialog: null,
    } satisfies ExternalServicesPanelProps,
    externalApplications: {
      ...externalApplicationsDefaults,
      onSelectApplication: () => undefined,
      onSelectHistory: () => undefined,
      onRetryHistory: () => undefined,
      onCreate: () => undefined,
      onToggle: () => undefined,
      onRename: () => undefined,
      onDuplicate: () => undefined,
      onDelete: () => undefined,
      onChange: () => undefined,
      onSave: () => undefined,
      onOpenNow: () => undefined,
    } satisfies ExternalApplicationsPanelProps,
  },
} as const;
