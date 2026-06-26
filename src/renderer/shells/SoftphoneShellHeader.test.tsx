// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  it("renders avatar, registration dot, and collapse toggle", () => {
    const onToggleCollapse = vi.fn();
    render(
      <SoftphoneShellHeader
        headerChrome={headerChrome}
        collapsed={false}
        connectionRecoveryShell={recoveryShell}
        connectionRecoveryActions={{ onReregisterSip: vi.fn(), onManualRetry: vi.fn(), onSafeLogout: vi.fn() }}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
        onToggleCollapse={onToggleCollapse}
      />,
    );

    expect(screen.getByTestId("user-avatar")).toHaveTextContent("AB");
    expect(screen.getByTestId("user-avatar")).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.getByTestId("registration-status-dot")).toBeInTheDocument();
    expect(screen.queryByTestId("control-open-settings")).not.toBeInTheDocument();
    expect(screen.queryByTestId("control-end-session")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("control-toggle-collapse"));
    expect(onToggleCollapse).toHaveBeenCalledOnce();
  });

  it("hides recovery row when collapsed", () => {
    render(
      <SoftphoneShellHeader
        headerChrome={headerChrome}
        collapsed
        connectionRecoveryShell={{
          ...recoveryShell,
          showReregisterSipControl: true,
        }}
        connectionRecoveryActions={{ onReregisterSip: vi.fn(), onManualRetry: vi.fn(), onSafeLogout: vi.fn() }}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
        onToggleCollapse={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("control-reregister-sip")).not.toBeInTheDocument();
    expect(screen.getByTestId("control-toggle-collapse")).toHaveAttribute(
      "aria-label",
      "Развернуть софтфон",
    );
  });

  it("shows avatar recovery ring during SIP re-registration countdown", () => {
    render(
      <SoftphoneShellHeader
        headerChrome={{
          ...headerChrome,
          registrationDotVariant: "failed",
        }}
        collapsed={false}
        connectionRecoveryShell={{
          ...recoveryShell,
          showAvatarRecoveryRing: true,
          avatarRecoveryRingTone: "failed",
          avatarRecoveryOverlayMode: "countdown",
          connectionState: "reconnecting",
          sipRecoveryMode: "registration",
          reconnectCountdownSeconds: 7,
          sipReconnectAttempt: 1,
        }}
        connectionRecoveryActions={{ onReregisterSip: vi.fn(), onManualRetry: vi.fn(), onSafeLogout: vi.fn() }}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
        onToggleCollapse={vi.fn()}
      />,
    );

    expect(screen.getByTestId("avatar-recovery-ring")).toHaveAttribute("data-visible", "true");
    expect(screen.getByTestId("avatar-recovery-countdown")).toHaveTextContent("7");
  });

  it("shows avatar reload after exhausted SIP registration attempts", () => {
    render(
      <SoftphoneShellHeader
        headerChrome={{
          ...headerChrome,
          registrationDotVariant: "failed",
        }}
        collapsed={false}
        connectionRecoveryShell={{
          ...recoveryShell,
          showAvatarRecoveryRing: true,
          avatarRecoveryRingTone: "failed",
          avatarRecoveryOverlayMode: "reload",
          connectionState: "manual_retry_available",
          sipRecoveryMode: "registration",
          sipReconnectAttempt: 5,
        }}
        connectionRecoveryActions={{ onReregisterSip: vi.fn(), onManualRetry: vi.fn(), onSafeLogout: vi.fn() }}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
        onToggleCollapse={vi.fn()}
      />,
    );

    expect(screen.getByTestId("avatar-recovery-reload")).toBeInTheDocument();
    expect(screen.queryByTestId("connection-overlay")).not.toBeInTheDocument();
  });
});
