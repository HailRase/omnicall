import { initialOcpSessionProjection } from "@application/projections/integration/ocpSessionProjection.js";
import { OCP_INTEGRATION_DEFAULTS } from "@application/index.js";
import { vi } from "vitest";
import type { OcpModuleSettingsCardProps } from "./OcpModuleSettingsCard.js";

export const settingsIntegrationsTestDefaults = {
  integrations: {
    ocp: {
      settings: { ...OCP_INTEGRATION_DEFAULTS },
      session: initialOcpSessionProjection(),
      tokenDraft: "",
      tokenVisible: false,
      hasSavedToken: false,
      actionLoading: null,
      errorKey: null,
      onEnabledChange: vi.fn(),
      onDomainChange: vi.fn(),
      onAutoConnectChange: vi.fn(),
      onAutoSipAuthChange: vi.fn(),
      onTokenDraftChange: vi.fn(),
      onTokenVisibleChange: vi.fn(),
      onSaveToken: vi.fn(),
      onDeleteToken: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
    } satisfies OcpModuleSettingsCardProps,
  },
} as const;

export const settingsIntegrationsStoryDefaults = {
  integrations: {
    ocp: {
      settings: { ...OCP_INTEGRATION_DEFAULTS },
      session: initialOcpSessionProjection(),
      tokenDraft: "",
      tokenVisible: false,
      hasSavedToken: false,
      actionLoading: null,
      errorKey: null,
      onEnabledChange: () => undefined,
      onDomainChange: () => undefined,
      onAutoConnectChange: () => undefined,
      onAutoSipAuthChange: () => undefined,
      onTokenDraftChange: () => undefined,
      onTokenVisibleChange: () => undefined,
      onSaveToken: () => undefined,
      onDeleteToken: () => undefined,
      onConnect: () => undefined,
      onDisconnect: () => undefined,
    } satisfies OcpModuleSettingsCardProps,
  },
} as const;
