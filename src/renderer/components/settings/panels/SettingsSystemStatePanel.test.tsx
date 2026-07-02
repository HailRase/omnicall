// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCorrelationId } from "@shared/correlation-id/index.js";
import { SettingsSystemStatePanel } from "./SettingsSystemStatePanel.js";
import { idleSystemStateShell } from "./settingsSystemStateTestDefaults.js";

afterEach(() => {
  cleanup();
});

const baseProps = {
  shell: idleSystemStateShell,
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
  onForceRefreshRegistration: vi.fn(),
  onClearJournal: vi.fn(),
  actionError: null,
};

describe("SettingsSystemStatePanel", () => {
  it("renders current state with Russian labels", () => {
    render(<SettingsSystemStatePanel {...baseProps} />);

    expect(screen.getByTestId("settings-sip-transport-state")).toHaveTextContent("Не активно");
    expect(screen.getByTestId("settings-sip-registration-state")).toHaveTextContent("Не активна");
    expect(screen.getByTestId("settings-sip-summary-label")).toHaveTextContent("Не подключено");
  });

  it("disables reconnect interval when auto-reconnect is off", () => {
    render(<SettingsSystemStatePanel {...baseProps} sipAutoReconnectEnabled={false} />);

    expect(screen.getByTestId("settings-sip-reconnect-interval")).toBeDisabled();
  });

  it("emits manual transport reconnect action", async () => {
    const user = userEvent.setup();
    const onManualTransportReconnect = vi.fn();
    const shell = {
      ...idleSystemStateShell,
      manualTransportReconnectDisabledReason: null,
      manualReregisterDisabledReason: null,
      forceRefreshDisabledReason: null,
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

  it("shows disabled reason for manual actions in idle session", () => {
    render(<SettingsSystemStatePanel {...baseProps} />);

    expect(screen.getByTestId("settings-sip-transport-disabled-reason")).toHaveTextContent(
      "Сессия не активна",
    );
  });
});
