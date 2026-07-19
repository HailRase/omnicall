import { OCP_INTEGRATION_DEFAULTS } from "@application/index.js";
import { vi } from "vitest";
import type { OcpModuleSettingsCardProps } from "./OcpModuleSettingsCard.js";

const ocpCardDefaults = {
  settings: { ...OCP_INTEGRATION_DEFAULTS, linked: true, enabled: true, domain: "ocp.example" },
  activeLoginLabel: "agent-1",
  errorKey: null,
  configEditable: true,
  onEnabledChange: vi.fn(),
  onDomainChange: vi.fn(),
  onAutoConnectChange: vi.fn(),
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
      onEnabledChange: () => undefined,
      onDomainChange: () => undefined,
      onAutoConnectChange: () => undefined,
    } satisfies OcpModuleSettingsCardProps,
  },
} as const;
