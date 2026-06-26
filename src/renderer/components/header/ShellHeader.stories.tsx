import type { JSX } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { HeaderChromeShellViewModel } from "@application/index.js";
import headerStyles from "../../shells/SoftphoneShellHeader.module.css";
import { RegistrationStatusDot } from "./RegistrationStatusDot.js";
import { UserAvatar } from "./UserAvatar.js";
import { SoftphoneShellHeader } from "../../shells/SoftphoneShellHeader.js";

const headerChrome: HeaderChromeShellViewModel = {
  registrationDotVariant: "registered_online",
  registrationStatusLabel: "Registered",
  phoneStatusLabel: "Online",
  avatarInitials: "AO",
  registrationDotAriaLabel: "Registration Registered, phone Online",
};

const recoveryShell = {
  showOverlay: false,
  isBlocking: false,
  showOcpRow: false,
  showSipRow: false,
  retryDisabledReason: null,
  showReregisterSipControl: false,
  reregisterDisabledReason: null,
  safeLogoutDisabledReason: null,
  ocpMaxAttempts: 3,
  sipMaxAttempts: 5,
  connectionState: "connected" as const,
  reconnectCountdownSeconds: null,
  lastFailureReason: null,
  ocpReconnectAttempt: null,
  sipReconnectAttempt: null,
  nextRetryAt: null,
  isOcpMode: false,
  sipRecoveryMode: null,
};

const noop = (): void => undefined;

const baseHeaderArgs = {
  headerChrome,
  collapsed: false,
  connectionRecoveryShell: recoveryShell,
  connectionRecoveryActions: {
    onManualRetry: noop,
    onSafeLogout: noop,
    onReregisterSip: noop,
  },
  sessionLogoutActions: {
    shell: {
      showEndSessionControl: false,
      endSessionDisabledReason: null,
      logoutConfirmationRequired: false,
      logoutInProgress: false,
      showLogoutErrorBanner: false,
      logoutErrorMessage: null,
    },
    confirmationModalOpen: false,
    handleEndSession: noop,
    handleConfirmLogout: noop,
    handleCancelLogout: noop,
    handleRetryLogout: noop,
  },
  onToggleCollapse: noop,
  onOpenSettings: noop,
};

const meta = {
  title: "Header/ShellHeader",
  component: SoftphoneShellHeader,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (StoryComponent: () => JSX.Element) => (
      <div style={{ maxWidth: 420, padding: 16, background: "#111722" }}>
        <StoryComponent />
      </div>
    ),
  ],
} satisfies Meta<typeof SoftphoneShellHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  args: baseHeaderArgs,
};

export const Collapsed: Story = {
  args: {
    ...baseHeaderArgs,
    collapsed: true,
  },
};

export const AvatarAndDot: Story = {
  args: baseHeaderArgs,
  render: () => (
    <div
      className={headerStyles["avatarGroup"]}
      style={{ padding: 16, background: "var(--color-bg-app)" }}
    >
      <UserAvatar initials="AO" />
      <RegistrationStatusDot
        variant="registered_dnd"
        label="Registration Registered, phone DND"
      />
    </div>
  ),
};
