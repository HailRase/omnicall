import { initialOcpSessionProjection } from "@application/projections/integration/ocpSessionProjection.js";
import { OCP_INTEGRATION_DEFAULTS } from "@application/index.js";
import { vi } from "vitest";
import type { OcpModuleSettingsCardProps } from "./OcpModuleSettingsCard.js";

const ocpCardDefaults = {
  settings: { ...OCP_INTEGRATION_DEFAULTS },
  session: initialOcpSessionProjection(),
  login: "",
  loginOptions: [],
  apiKeyDraft: "",
  apiKeyVisible: false,
  hasSavedApiKey: false,
  actionLoading: null,
  errorKey: null,
  onLoginChange: vi.fn(),
  onEnabledChange: vi.fn(),
  onDomainChange: vi.fn(),
  onAutoConnectChange: vi.fn(),
  onApiKeyDraftChange: vi.fn(),
  onApiKeyVisibleChange: vi.fn(),
  onSaveApiKey: vi.fn(),
  onDeleteApiKey: vi.fn(),
  onConnect: vi.fn(),
  onDisconnect: vi.fn(),
} satisfies OcpModuleSettingsCardProps;

export const settingsIntegrationsTestDefaults = {
  integrations: {
    ocp: ocpCardDefaults,
  },
} as const;

export const settingsIntegrationsStoryDefaults = {
  integrations: {
    ocp: {
      ...ocpCardDefaults,
      onLoginChange: () => undefined,
      onEnabledChange: () => undefined,
      onDomainChange: () => undefined,
      onAutoConnectChange: () => undefined,
      onApiKeyDraftChange: () => undefined,
      onApiKeyVisibleChange: () => undefined,
      onSaveApiKey: () => undefined,
      onDeleteApiKey: () => undefined,
      onConnect: () => undefined,
      onDisconnect: () => undefined,
    } satisfies OcpModuleSettingsCardProps,
  },
} as const;
