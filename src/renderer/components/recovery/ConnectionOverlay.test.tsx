// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionOverlay } from "./ConnectionOverlay.js";
import { mapSipRegistrationFailureReason } from "../../helpers/mapSipRegistrationFailureReason.js";

const baseProps = {
  sipRecoveryMode: null,
  isBlocking: true,
  showOcpRow: true,
  showSipRow: true,
  ocpReconnectAttempt: 2,
  sipReconnectAttempt: 1,
  ocpMaxAttempts: 6,
  sipMaxAttempts: 5,
  reconnectCountdownSeconds: null,
  lastFailureReason: null,
  retryDisabledReason: "Manual retry not available yet",
  onManualRetry: vi.fn(),
} as const;

afterEach(() => {
  cleanup();
});

describe("ConnectionOverlay", () => {
  it("renders nothing when connected", () => {
    const { container } = render(
      <ConnectionOverlay {...baseProps} connectionState="connected" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders in-progress state when reconnecting without countdown", () => {
    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="reconnecting"
        reconnectCountdownSeconds={null}
        retryDisabledReason="Automatic reconnect in progress"
      />,
    );

    expect(screen.getByTestId("reconnect-in-progress")).toHaveTextContent(
      "Переподключение выполняется…",
    );
    expect(screen.queryByTestId("reconnect-countdown")).not.toBeInTheDocument();
  });

  it("renders overlay with test id and disabled retry for reconnecting", () => {
    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="reconnecting"
        reconnectCountdownSeconds={4}
        retryDisabledReason="Automatic reconnect in progress"
      />,
    );

    expect(screen.getByTestId("connection-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("reconnect-countdown")).toHaveTextContent(
      "Следующая попытка через 4 секунды",
    );
    expect(screen.getByTestId("control-retry-connection")).toBeDisabled();
    expect(screen.getByTestId("control-retry-connection")).toHaveAttribute(
      "aria-label",
      "Повторить подключение",
    );
  });

  it("uses alertdialog role when blocking SIP", () => {
    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="sip_disconnected"
        isBlocking
        lastFailureReason="transport_closed"
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByTestId("connection-channel-sip")).toBeInTheDocument();
  });

  it("hides OCP row in SIP-only style props", () => {
    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="sip_disconnected"
        showOcpRow={false}
        showSipRow
        ocpReconnectAttempt={null}
      />,
    );

    expect(screen.queryByTestId("connection-channel-ocp")).not.toBeInTheDocument();
    expect(screen.getByTestId("connection-channel-sip")).toBeInTheDocument();
  });

  it("renders enabled retry when manual retry is available", () => {
    const onManualRetry = vi.fn();

    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="manual_retry_available"
        retryDisabledReason={null}
        onManualRetry={onManualRetry}
      />,
    );

    const retryButton = screen.getByTestId("control-retry-connection");
    expect(retryButton).toBeEnabled();
    retryButton.click();
    expect(onManualRetry).toHaveBeenCalledTimes(1);
  });

  it("renders non-dismissable server terminate copy", () => {
    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="server_terminate"
        isBlocking
        lastFailureReason="session_revoked"
        retryDisabledReason="Session ended by server"
        safeLogoutDisabledReason={null}
        onSafeLogout={vi.fn()}
      />,
    );

    expect(screen.getByTestId("connection-server-terminate")).toBeInTheDocument();
    expect(screen.getByTestId("control-retry-connection")).toBeDisabled();
    expect(screen.getByTestId("control-safe-logout")).toBeEnabled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("uses region role for OCP-only non-blocking banner", () => {
    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="ocp_disconnected"
        isBlocking={false}
        showSipRow={false}
        sipReconnectAttempt={null}
        lastFailureReason="transport_closed"
      />,
    );

    expect(screen.getByRole("region", { name: "Состояние подключения" })).toBeInTheDocument();
  });

  it("renders sip registration failed state with Russian failure reason", () => {
    const failureReason = mapSipRegistrationFailureReason("authentication_error");

    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="sip_registration_failed"
        sipRecoveryMode="registration"
        isBlocking
        showSipRow
        showOcpRow={false}
        sipReconnectAttempt={null}
        lastFailureReason={failureReason}
        retryDisabledReason="Manual retry not available yet"
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Ошибка регистрации SIP")).toBeInTheDocument();
    expect(screen.getByText(failureReason)).toBeInTheDocument();
    expect(screen.queryByTestId("reconnect-in-progress")).not.toBeInTheDocument();
  });

  it("renders registration retry in-progress copy", () => {
    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="reconnecting"
        sipRecoveryMode="registration"
        reconnectCountdownSeconds={null}
        retryDisabledReason="Automatic re-registration in progress"
      />,
    );

    expect(screen.getByTestId("reregister-in-progress")).toHaveTextContent(
      "Перерегистрация выполняется…",
    );
    expect(screen.queryByTestId("reconnect-in-progress")).not.toBeInTheDocument();
  });

  it("renders full-screen scrim when blocking to prevent click-through", () => {
    render(
      <ConnectionOverlay
        {...baseProps}
        connectionState="sip_disconnected"
        isBlocking
        lastFailureReason="transport_closed"
      />,
    );

    expect(screen.getByTestId("connection-overlay-scrim")).toBeInTheDocument();
    expect(screen.getByTestId("connection-overlay")).toHaveAttribute("aria-modal", "true");
  });
});
