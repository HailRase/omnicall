// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HeaderChromeShellViewModel } from "@application/index.js";
import { SoftphoneShellHeader } from "./SoftphoneShellHeader.js";

afterEach(() => {
  cleanup();
});

const headerChrome: HeaderChromeShellViewModel = {
  registrationDotVariant: "registered_online",
  registrationStatusLabel: "Registered",
  phoneStatusLabel: "Online",
  avatarInitials: "AB",
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

const userAvatarMenu = {
  open: false,
  anchorRef: { current: null },
  menuRef: { current: null },
  position: { top: 0, left: 0 },
  toggle: vi.fn(),
  close: vi.fn(),
};

const userAvatarMenuActions = {
  dndEnabled: false,
  dndDisabledReason: null,
  logoutDisabledReason: null,
  handleOpenSettings: vi.fn(),
  handleToggleDnd: vi.fn(),
  handleLogout: vi.fn(),
};

describe("SoftphoneShellHeader", () => {
  it("renders avatar and registration dot", () => {
    render(
      <SoftphoneShellHeader
        headerChrome={headerChrome}
        connectionRecoveryShell={recoveryShell}
        connectionRecoveryActions={{ onReregisterSip: vi.fn(), onManualRetry: vi.fn(), onSafeLogout: vi.fn() }}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
      />,
    );

    expect(screen.getByTestId("user-avatar")).toHaveTextContent("AB");
    expect(screen.getByTestId("user-avatar")).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.getByTestId("registration-status-dot")).toBeInTheDocument();
    expect(screen.queryByTestId("control-open-settings")).not.toBeInTheDocument();
    expect(screen.queryByTestId("control-end-session")).not.toBeInTheDocument();
    expect(screen.queryByTestId("control-toggle-collapse")).not.toBeInTheDocument();
  });

  it("shows SIP re-register control when recovery shell requests it", () => {
    render(
      <SoftphoneShellHeader
        headerChrome={headerChrome}
        connectionRecoveryShell={{
          ...recoveryShell,
          showReregisterSipControl: true,
        }}
        connectionRecoveryActions={{ onReregisterSip: vi.fn(), onManualRetry: vi.fn(), onSafeLogout: vi.fn() }}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
      />,
    );

    expect(screen.getByTestId("control-reregister-sip")).toBeInTheDocument();
    expect(screen.queryByTestId("avatar-recovery-ring")).not.toBeInTheDocument();
  });
});
