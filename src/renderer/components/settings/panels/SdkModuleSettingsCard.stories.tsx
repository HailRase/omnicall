import type { Meta, StoryObj } from "@storybook/react";
import { createDefaultSdkOriginCapabilityMatrix } from "@application/index.js";
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
  settings: {
    originsManaged: true,
    origins: [
      {
        origin: "https://crm.example",
        state: "allowed" as const,
        matrix: createDefaultSdkOriginCapabilityMatrix(),
        previouslyAllowed: true,
      },
      {
        origin: "https://ops.example",
        state: "allowed" as const,
        matrix: createDefaultSdkOriginCapabilityMatrix(),
        previouslyAllowed: true,
      },
      {
        origin: "https://blocked.example",
        state: "denied" as const,
        matrix: null,
        previouslyAllowed: false,
      },
    ],
  },
  diagnostics: {
    status: "listening" as const,
    bindHost: "127.0.0.1",
    bindPort: 17341,
    connectionCount: 1,
    authenticatedCount: 1,
    unauthenticatedCount: 0,
    pendingPairingCount: 0,
    pairedClientCount: 1,
    allowedOriginsCount: 2,
    lastErrorCode: null,
    windowHideAvailable: false as const,
  },
  allowedOriginsLive: ["https://crm.example", "https://ops.example"],
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
  profileOptions: [{ id: "agent@sip.example|sip", label: "agent@sip.example" }],
  selectedClientId: "cli_1",
  selectedProfileId: "agent@sip.example|sip",
  lastGrant: null,
  addOriginDraft: "",
  errorKey: null,
  busy: false,
  onAddOriginDraftChange: () => undefined,
  onAddOrigin: () => undefined,
  onRefresh: () => undefined,
  onRevokeClient: () => undefined,
  onSelectClientId: () => undefined,
  onSelectProfileId: () => undefined,
  onIssueActivateGrant: () => undefined,
  onUnblockOrigin: () => undefined,
  onBlacklistOrigin: () => undefined,
  onRemoveAllowedOrigin: () => undefined,
  onRenameAllowedOrigin: () => undefined,
  onSetOriginMatrix: () => undefined,
};

export const Light: Story = {
  args: baseArgs,
  parameters: { theme: "light" },
};

export const Dark: Story = {
  args: baseArgs,
  parameters: { theme: "dark" },
};
