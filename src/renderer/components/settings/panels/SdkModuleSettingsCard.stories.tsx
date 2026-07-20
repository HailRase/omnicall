import type { Meta, StoryObj } from "@storybook/react";
import { SDK_INTEGRATION_DEFAULTS } from "@application/index.js";
import { SdkModuleSettingsCard } from "./SdkModuleSettingsCard.js";

const meta = {
  title: "Settings/SdkModuleSettingsCard",
  component: SdkModuleSettingsCard,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof SdkModuleSettingsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  settings: { ...SDK_INTEGRATION_DEFAULTS, enabled: true, originsManaged: true },
  diagnostics: {
    status: "listening" as const,
    bindHost: "127.0.0.1",
    bindPort: 17341,
    connectionCount: 1,
    authenticatedCount: 1,
    unauthenticatedCount: 0,
    pendingPairingCount: 0,
    pairedClientCount: 1,
    allowedOriginsCount: 1,
    lastErrorCode: null,
    windowHideAvailable: false as const,
  },
  allowedOriginsLive: ["https://crm.example"],
  pairedClients: [
    {
      clientId: "cli_1",
      origin: "https://crm.example",
      profile: "presentation",
      applicationName: "CRM Tab",
      createdAt: "2026-07-20T00:00:00.000Z",
      expiresAt: null,
      revoked: false,
      capabilityCount: 3,
    },
  ],
  pendingPairing: [],
  profileOptions: [{ id: "agent@sip.example|sip", label: "agent@sip.example" }],
  selectedClientId: "cli_1",
  selectedProfileId: "agent@sip.example|sip",
  lastGrant: null,
  originsDraft: "https://crm.example",
  errorKey: null,
  busy: false,
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
};

export const Light: Story = {
  args: baseArgs,
  parameters: { theme: "light" },
};

export const Dark: Story = {
  args: baseArgs,
  parameters: { theme: "dark" },
};
