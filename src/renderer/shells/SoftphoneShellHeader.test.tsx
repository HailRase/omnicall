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
  registrationDotAriaLabelKey: "header.sipStatus.aria",
  registrationDotAriaLabelParams: {
    statusKey: "header.sipStatus.registered",
  },
  avatarInitials: "AB",
  showUserIdentity: true,
  displayName: "agent",
  sipStatusLabelKey: "header.sipStatus.registered",
  sipStatusTimerSuffix: null,
  sipStatusTone: "registered",
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

const windowControls = {
  platform: "linux" as const,
  showNativeWindowControls: true,
  isShuttingDown: false,
  onMinimize: vi.fn(),
  onClose: vi.fn(),
  onRestart: vi.fn(),
};

describe("SoftphoneShellHeader", () => {
  it("hides shell window controls when suppressWindowControls is true", () => {
    render(
      <SoftphoneShellHeader
        headerChrome={headerChrome}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
        windowControls={windowControls}
        suppressWindowControls
      />,
    );

    expect(screen.queryByTestId("shell-window-controls")).not.toBeInTheDocument();
    expect(screen.getByTestId("shell-header")).toBeInTheDocument();
  });

  it("renders avatar, registration dot, and SIP status without recovery controls", () => {
    render(
      <SoftphoneShellHeader
        headerChrome={headerChrome}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
        windowControls={windowControls}
      />,
    );

    expect(screen.getByTestId("user-avatar")).toHaveTextContent("AB");
    expect(screen.getByTestId("user-avatar")).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.getByTestId("registration-status-dot")).toBeInTheDocument();
    expect(screen.getByTestId("user-header-identity")).toBeInTheDocument();
    expect(screen.getByTestId("user-sip-status")).toHaveTextContent("Зарегистрирован");
    expect(screen.queryByTestId("control-open-settings")).not.toBeInTheDocument();
    expect(screen.queryByTestId("control-end-session")).not.toBeInTheDocument();
    expect(screen.queryByTestId("control-toggle-collapse")).not.toBeInTheDocument();
    expect(screen.queryByTestId("control-reregister-sip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connection-overlay")).not.toBeInTheDocument();
  });

  it("shows reconnect timer suffix in SIP status line", () => {
    render(
      <SoftphoneShellHeader
        headerChrome={{
          ...headerChrome,
          sipStatusLabelKey: "header.sipStatus.noConnection",
          sipStatusTimerSuffix: "01:23",
          sipStatusTone: "reconnecting",
          registrationDotVariant: "failed",
          registrationDotAriaLabelKey: "header.sipStatus.ariaWithRetry",
          registrationDotAriaLabelParams: {
            statusKey: "header.sipStatus.noConnection",
            timer: "01:23",
          },
        }}
        userAvatarMenu={userAvatarMenu}
        userAvatarMenuActions={userAvatarMenuActions}
        windowControls={windowControls}
      />,
    );

    expect(screen.getByTestId("user-sip-status")).toHaveTextContent("Нет соединения");
    expect(screen.getByTestId("user-sip-status-timer")).toHaveTextContent("01:23");
  });
});
