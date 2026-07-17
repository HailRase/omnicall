// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { ICON_TOOLTIP_DELAY_MS } from "../../icons/iconTooltipDelay.js";
import { setupJsdomRadix } from "../../../test/setupJsdomRadix.js";
import { SettingsSystemStatePanel } from "./SettingsSystemStatePanel.js";
import {
  idleOcpSystemStateShell,
  idleSystemStateShell,
} from "./settingsSystemStateTestDefaults.js";

beforeEach(() => {
  setupJsdomRadix();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const baseProps = {
  shell: idleSystemStateShell,
  ocpShell: idleOcpSystemStateShell,
  ocpRecoveryActionLoading: null,
  onOcpRecoveryAction: vi.fn(),
  sipAutoReconnectEnabled: true,
  onSipAutoReconnectChange: vi.fn(),
  sipReconnectIntervalSec: 5,
  onSipReconnectIntervalChange: vi.fn(),
  sipReconnectMaxAttempts: 5,
  onSipReconnectMaxAttemptsChange: vi.fn(),
  sipAutoReregisterEnabled: true,
  onSipAutoReregisterChange: vi.fn(),
  sipReregisterIntervalSec: 5,
  onSipReregisterIntervalChange: vi.fn(),
  sipReregisterMaxAttempts: 5,
  onSipReregisterMaxAttemptsChange: vi.fn(),
  sipAutoRegisterOnStartup: false,
  onSipAutoRegisterOnStartupChange: vi.fn(),
  onManualTransportReconnect: vi.fn(),
  onManualReregister: vi.fn(),
  onClearJournal: vi.fn(),
  actionLoading: null,
};

describe("SettingsSystemStatePanel", () => {
  it("renders SIP/OCP tabs and SIP state with Russian labels", () => {
    render(<SettingsSystemStatePanel {...baseProps} />);

    expect(screen.getByTestId("settings-system-state-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("settings-system-state-tab-sip")).toHaveTextContent("SIP сервер");
    expect(screen.getByTestId("settings-system-state-tab-ocp")).toHaveTextContent("OCP-модуль");
    expect(screen.getByTestId("settings-sip-transport-state")).toHaveTextContent("Неактивно");
    expect(screen.getByTestId("settings-sip-registration-state")).toHaveTextContent("Неактивна");
    expect(screen.getByTestId("settings-sip-summary-label")).toHaveTextContent("Не подключено");
  });

  it("switches to OCP tab and shows dual status plus recovery action", async () => {
    const user = userEvent.setup();
    const onOcpRecoveryAction = vi.fn();
    const ocpShell = {
      ...idleOcpSystemStateShell,
      serverState: "failed" as const,
      serverStateLabelKey: "settings.systemState.ocp.server.failed" as const,
      primaryRecoveryAction: "retry_server" as const,
      allowedRecoveryActions: ["retry_server" as const],
    };

    render(
      <SettingsSystemStatePanel
        {...baseProps}
        ocpShell={ocpShell}
        onOcpRecoveryAction={onOcpRecoveryAction}
      />,
    );

    await user.click(screen.getByTestId("settings-system-state-tab-ocp"));
    expect(screen.getByTestId("settings-ocp-server-status")).toHaveTextContent("Ошибка");
    expect(screen.getByTestId("settings-ocp-authorization-status")).toHaveTextContent(
      "Неактивна",
    );
    await user.click(screen.getByTestId("settings-ocp-retry-server"));
    expect(onOcpRecoveryAction).toHaveBeenCalledWith("retry_server");
  });

  it("disables OCP tab when module is off", () => {
    render(
      <SettingsSystemStatePanel
        {...baseProps}
        ocpShell={{
          ...idleOcpSystemStateShell,
          ocpModuleEnabled: false,
          tabDisabledReasonKey: "settings.systemState.ocp.tab.disabled.moduleOff",
        }}
      />,
    );

    expect(screen.getByTestId("settings-system-state-tab-ocp")).toBeDisabled();
  });

  it("announces live state summary for screen readers", () => {
    render(<SettingsSystemStatePanel {...baseProps} />);

    expect(screen.getByText(/Сервер: Неактивно/)).toHaveAttribute("aria-live", "polite");
  });

  it("disables reconnect interval when auto-reconnect is off", () => {
    render(<SettingsSystemStatePanel {...baseProps} sipAutoReconnectEnabled={false} />);

    expect(screen.getByTestId("settings-sip-reconnect-interval")).toBeDisabled();
    expect(screen.getByTestId("settings-sip-reconnect-interval")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows interval validation error below minimum", () => {
    render(
      <SettingsSystemStatePanel
        {...baseProps}
        sipReconnectIntervalSec={4}
        onSipReconnectIntervalChange={vi.fn()}
      />,
    );

    const intervalInput = screen.getByTestId("settings-sip-reconnect-interval");
    expect(screen.getByText("Минимальное значение — 5 сек")).toBeInTheDocument();
    expect(intervalInput).toHaveAttribute("aria-invalid", "true");
  });

  it("emits manual transport reconnect action", async () => {
    const user = userEvent.setup();
    const onManualTransportReconnect = vi.fn();
    const shell = {
      ...idleSystemStateShell,
      manualTransportReconnectDisabledReasonKey: null,
      manualReregisterDisabledReasonKey: null,
    };

    render(
      <SettingsSystemStatePanel
        {...baseProps}
        shell={shell}
        onManualTransportReconnect={onManualTransportReconnect}
      />,
    );

    await user.click(screen.getByTestId("settings-sip-manual-transport-reconnect"));
    expect(onManualTransportReconnect).toHaveBeenCalledOnce();
  });

  it("shows loading label while manual action is in progress", () => {
    const shell = {
      ...idleSystemStateShell,
      manualTransportReconnectDisabledReasonKey: null,
    };

    render(
      <SettingsSystemStatePanel
        {...baseProps}
        shell={shell}
        actionLoading="transport"
      />,
    );

    expect(screen.getByTestId("settings-sip-manual-transport-reconnect")).toHaveTextContent(
      "Переподключение…",
    );
    expect(screen.getByTestId("settings-sip-manual-transport-reconnect")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("shows journal entries and clear action", async () => {
    const user = userEvent.setup();
    const onClearJournal = vi.fn();
    const correlationId = createCorrelationId();
    const shell = {
      ...idleSystemStateShell,
      journalEntries: [
        {
          timestamp: "2026-06-24T10:00:00.000Z",
          correlationId,
          category: "transport" as const,
          eventType: "SipTransportDisconnected",
          detail: "transport_closed",
        },
      ],
    };

    render(
      <SettingsSystemStatePanel {...baseProps} shell={shell} onClearJournal={onClearJournal} />,
    );

    expect(screen.getByTestId("settings-sip-journal-entry")).toHaveTextContent(
      "SipTransportDisconnected",
    );
    await user.click(screen.getByTestId("settings-sip-journal-clear"));
    expect(onClearJournal).toHaveBeenCalledOnce();
  });

  it("shows journal empty state hint", () => {
    render(<SettingsSystemStatePanel {...baseProps} />);

    expect(screen.getByTestId("settings-sip-journal-empty")).toHaveTextContent("Событий пока нет");
    expect(screen.getByText(/события сервера, регистрации и ошибок/i)).toBeInTheDocument();
  });

  it("exposes disabled reason via tooltip and screen-reader text only", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<SettingsSystemStatePanel {...baseProps} />);

    const reconnectButton = screen.getByTestId("settings-sip-manual-transport-reconnect");
    expect(reconnectButton).not.toHaveAttribute("title");
    expect(screen.getByTestId("settings-sip-transport-disabled-reason")).toHaveTextContent(
      "Сессия не активна",
    );
    expect(screen.queryByText("Недоступно: сессия не активна")).not.toBeInTheDocument();

    const tooltipHost = reconnectButton.parentElement;
    expect(tooltipHost).toHaveAttribute("data-testid", "icon-tooltip-host");
    fireEvent.pointerEnter(tooltipHost as Element);
    act(() => {
      vi.advanceTimersByTime(ICON_TOOLTIP_DELAY_MS);
    });
    expect(screen.getByRole("tooltip")).toHaveTextContent("Сессия не активна");

    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("groups automatic recovery into server and registration subsections", () => {
    render(<SettingsSystemStatePanel {...baseProps} />);

    expect(screen.getByTestId("settings-sip-recovery-server")).toHaveTextContent("Сервер");
    expect(screen.getByTestId("settings-sip-recovery-registration")).toHaveTextContent(
      "Регистрация",
    );
    expect(screen.getByTestId("settings-sip-recovery-server")).toContainElement(
      screen.getByTestId("settings-sip-auto-reconnect-toggle"),
    );
    expect(screen.getByTestId("settings-sip-recovery-registration")).toContainElement(
      screen.getByTestId("settings-sip-auto-reregister-toggle"),
    );
  });

  it("places manual actions next to matching current state rows", () => {
    render(<SettingsSystemStatePanel {...baseProps} />);

    const transportState = screen.getByTestId("settings-sip-transport-state");
    const reconnectButton = screen.getByTestId("settings-sip-manual-transport-reconnect");
    expect(transportState.closest('[class*="stateActionRow"]')).toContainElement(reconnectButton);

    const registrationState = screen.getByTestId("settings-sip-registration-state");
    expect(registrationState.closest('[class*="stateActionRow"]')).toContainElement(
      screen.getByTestId("settings-sip-manual-reregister"),
    );
  });

});
