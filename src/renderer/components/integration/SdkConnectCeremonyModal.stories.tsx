import type { Meta, StoryObj } from "@storybook/react";
import { SdkConnectCeremonyModal } from "./SdkConnectCeremonyModal.js";
import type { SdkConnectCeremonyView } from "../../hooks/useSdkConnectCeremony.js";

const meta = {
  title: "Integration/SdkConnectCeremonyModal",
  component: SdkConnectCeremonyModal,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SdkConnectCeremonyModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const transportView: SdkConnectCeremonyView = {
  open: true,
  step: "transport",
  origin: "https://crm.example",
  showStepper: true,
  originTrustRequestId: "trust_1",
  pairing: null,
  expiresAt: new Date(Date.now() + 90_000).toISOString(),
};

const pairingView: SdkConnectCeremonyView = {
  open: true,
  step: "pairing",
  origin: "https://crm.example",
  showStepper: true,
  originTrustRequestId: null,
  pairing: {
    pairingRequestId: "pair_1",
    clientId: "cli_1",
    origin: "https://crm.example",
    applicationName: "CRM Tab",
    profile: "presentation",
    expiresAt: new Date(Date.now() + 120_000).toISOString(),
  },
  expiresAt: new Date(Date.now() + 120_000).toISOString(),
};

const baseHandlers = {
  busy: false,
  onAllowTransport: () => undefined,
  onDenyTransport: () => undefined,
  onApprovePairing: () => undefined,
  onDenyPairing: () => undefined,
  onCancelWaiting: () => undefined,
  onDismiss: () => undefined,
  onDeadlineExpired: () => undefined,
};

export const TransportLight: Story = {
  args: { ...baseHandlers, view: transportView },
  parameters: { theme: "light" },
};

export const TransportDark: Story = {
  args: { ...baseHandlers, view: transportView },
  parameters: { theme: "dark" },
};

export const PairingLight: Story = {
  args: { ...baseHandlers, view: pairingView },
  parameters: { theme: "light" },
};

export const PairingOnlyLight: Story = {
  args: {
    ...baseHandlers,
    view: { ...pairingView, showStepper: false },
  },
  parameters: { theme: "light" },
};

export const WaitingLight: Story = {
  args: {
    ...baseHandlers,
    view: {
      open: true,
      step: "waiting",
      origin: "https://crm.example",
      showStepper: true,
      originTrustRequestId: null,
      pairing: null,
      expiresAt: new Date(Date.now() + 45_000).toISOString(),
    },
  },
  parameters: { theme: "light" },
};
