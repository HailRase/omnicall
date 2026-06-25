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
    showEndSessionControl: false,
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
        onToggleCollapse={onToggleCollapse}
        onOpenSettings={vi.fn()}
        onOpenDiagnostics={vi.fn()}
      />,
    );

    expect(screen.getByTestId("user-avatar")).toHaveTextContent("AB");
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
        onToggleCollapse={vi.fn()}
        onOpenSettings={vi.fn()}
        onOpenDiagnostics={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("control-reregister-sip")).not.toBeInTheDocument();
    expect(screen.getByTestId("control-toggle-collapse")).toHaveAttribute(
      "aria-label",
      "Expand softphone",
    );
  });
});
