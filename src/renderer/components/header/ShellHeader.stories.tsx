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
  showAvatarRecoveryRing: false,
  avatarRecoveryRingTone: null,
  avatarRecoveryOverlayMode: null,
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
  connectionRecoveryShell: recoveryShell,
  connectionRecoveryActions: {
    onManualRetry: noop,
    onSafeLogout: noop,
    onReregisterSip: noop,
  },
  userAvatarMenu: {
    open: false,
    anchorRef: { current: null },
    menuRef: { current: null },
    position: { top: 0, left: 0 },
    toggle: noop,
    close: noop,
  },
  userAvatarMenuActions: {
    dndEnabled: false,
    dndDisabledReason: null,
    logoutDisabledReason: null,
    handleOpenSettings: noop,
    handleToggleDnd: noop,
    handleLogout: noop,
  },
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

export const Default: Story = {
  args: baseHeaderArgs,
};

export const AvatarAndDot: Story = {
  args: baseHeaderArgs,
  render: () => (
    <div style={{ padding: 16, background: "var(--color-bg-app)" }}>
      <div className={headerStyles["avatarGroup"]}>
        <UserAvatar initials="AO" />
        <RegistrationStatusDot
          variant="registered_dnd"
          label="Registration Registered, phone DND"
        />
      </div>
    </div>
  ),
};

export const SipReregisterControl: Story = {
  args: {
    ...baseHeaderArgs,
    headerChrome: {
      ...headerChrome,
      registrationDotVariant: "failed",
      registrationDotAriaLabel: "Регистрация: Ошибка, телефон: В сети",
    },
    connectionRecoveryShell: {
      ...recoveryShell,
      connectionState: "manual_retry_available",
      sipRecoveryMode: "registration",
      showReregisterSipControl: true,
      sipReconnectAttempt: 5,
    },
  },
};
