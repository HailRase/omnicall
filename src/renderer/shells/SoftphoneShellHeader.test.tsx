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

const sessionLogoutActions = {
  shell: {
    showEndSessionControl: true,
    endSessionDisabledReason: null,
    logoutConfirmationRequired: false,
    logoutInProgress: false,
    showLogoutErrorBanner: false,
    logoutErrorMessage: null,
  },
  confirmationModalOpen: false,
  handleEndSession: vi.fn(),
  handleConfirmLogout: vi.fn(),
  handleCancelLogout: vi.fn(),
  handleRetryLogout: vi.fn(),
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
        sessionLogoutActions={sessionLogoutActions}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
        onToggleCollapse={onToggleCollapse}
        onOpenSettings={vi.fn()}
      />,
    );

    expect(screen.getByTestId("user-avatar")).toHaveTextContent("AB");
    expect(screen.getByTestId("user-avatar")).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.getByTestId("registration-status-dot")).toBeInTheDocument();
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
        sessionLogoutActions={{
          ...sessionLogoutActions,
          shell: {
            ...sessionLogoutActions.shell,
            showEndSessionControl: true,
          },
        }}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
        onToggleCollapse={vi.fn()}
        onOpenSettings={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("control-reregister-sip")).not.toBeInTheDocument();
    expect(screen.getByTestId("control-toggle-collapse")).toHaveAttribute(
      "aria-label",
      "Развернуть софтфон",
    );
  });
});
