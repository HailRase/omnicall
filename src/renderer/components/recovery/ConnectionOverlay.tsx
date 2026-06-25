import clsx from "clsx";
import type { JSX } from "react";
import type { ConnectionState, SipRecoveryMode } from "@application/index.js";
import { AppIcon, IconControlButton } from "../icons/index.js";
import styles from "./ConnectionOverlay.module.css";

export type ConnectionChannelRow = Readonly<{
  channel: "OCP" | "SIP";
  statusLabel: string;
  attempt: number | null;
  maxAttempts: number;
}>;

export type ConnectionOverlayProps = Readonly<{
  connectionState: ConnectionState;
  sipRecoveryMode: SipRecoveryMode | null;
  isBlocking: boolean;
  showOcpRow: boolean;
  showSipRow: boolean;
  ocpReconnectAttempt: number | null;
  sipReconnectAttempt: number | null;
  ocpMaxAttempts: number;
  sipMaxAttempts: number;
  reconnectCountdownSeconds: number | null;
  lastFailureReason: string | null;
  retryDisabledReason: string | null;
  safeLogoutDisabledReason?: string | null;
  onManualRetry?: () => void;
  onSafeLogout?: () => void;
}>;

/**
 * - Purpose: present lost-connection overlay from recovery projection (LF-057).
 * - Inputs: connection state, channel rows, countdown, disabled reasons.
 * - Outputs: accessible blocking or banner overlay without business logic.
 */
export function ConnectionOverlay({
  connectionState,
  sipRecoveryMode,
  isBlocking,
  showOcpRow,
  showSipRow,
  ocpReconnectAttempt,
  sipReconnectAttempt,
  ocpMaxAttempts,
  sipMaxAttempts,
  reconnectCountdownSeconds,
  lastFailureReason,
  retryDisabledReason,
  safeLogoutDisabledReason = "Безопасный выход недоступен",
  onManualRetry,
  onSafeLogout,
}: ConnectionOverlayProps): JSX.Element | null {
  if (connectionState === "connected") {
    return null;
  }

  const title = resolveOverlayTitle(connectionState, sipRecoveryMode);
  const isServerTerminate = connectionState === "server_terminate";
  const role = isBlocking ? "alertdialog" : "region";

  const channelRows = buildChannelRows({
    connectionState,
    sipRecoveryMode,
    showOcpRow,
    showSipRow,
    ocpReconnectAttempt,
    sipReconnectAttempt,
    ocpMaxAttempts,
    sipMaxAttempts,
  });

  const showCountdown =
    connectionState === "reconnecting" &&
    reconnectCountdownSeconds !== null &&
    reconnectCountdownSeconds > 0;
  const showInProgress = connectionState === "reconnecting" && !showCountdown;

  return (
    <div
      className={clsx(styles["host"], isBlocking && styles["hostBlocking"])}
      data-testid="connection-overlay-host"
    >
      {isBlocking ? (
        <div
          className={styles["scrim"]}
          data-testid="connection-overlay-scrim"
          aria-hidden="true"
        />
      ) : null}
      <section
        className={clsx(
          styles["overlay"],
          isBlocking ? styles["overlayBlocking"] : styles["overlayBanner"],
        )}
        role={role}
        aria-label="Состояние подключения"
        data-testid="connection-overlay"
        aria-modal={isBlocking ? "true" : undefined}
      >
        <h2 className={styles["title"]}>
          <span className={styles["titleIcon"]}>
            <AppIcon id="call.phone-off" decorative />
          </span>
          {title}
        </h2>

        {isServerTerminate && (
          <p className={styles["message"]} data-testid="connection-server-terminate">
            Сессия завершена сервером. Дождитесь безопасного состояния приложения.
          </p>
        )}

        {lastFailureReason !== null && connectionState !== "reconnecting" && (
          <p className={styles["reason"]} role="status">
            {lastFailureReason}
          </p>
        )}

        <ul className={styles["channels"]} aria-label="Каналы подключения">
          {channelRows.map((row) => (
            <li
              key={row.channel}
              className={styles["channel"]}
              data-testid={`connection-channel-${row.channel.toLowerCase()}`}
            >
              <span className={styles["channelName"]}>{row.channel}</span>
              <span className={styles["channelStatus"]}>{row.statusLabel}</span>
              {row.attempt !== null && (
                <span className={styles["channelAttempt"]}>
                  Попытка {row.attempt} из {row.maxAttempts}
                </span>
              )}
            </li>
          ))}
        </ul>

        {showCountdown && reconnectCountdownSeconds !== null && (
          <p
            className={styles["countdown"]}
            data-testid="reconnect-countdown"
            aria-live="polite"
          >
            {formatCountdownMessage(reconnectCountdownSeconds)}
          </p>
        )}

        {showInProgress && (
          <p
            className={styles["loading"]}
            data-testid={
              sipRecoveryMode === "registration"
                ? "reregister-in-progress"
                : "reconnect-in-progress"
            }
            aria-live="polite"
            role="status"
          >
            {sipRecoveryMode === "registration"
              ? "Перерегистрация выполняется…"
              : "Переподключение выполняется…"}
          </p>
        )}

        <div className={styles["actions"]}>
          <IconControlButton
            iconId="connection.retry"
            ariaLabel="Повторить подключение"
            testId="control-retry-connection"
            className={styles["iconButton"]}
            disabledReason={retryDisabledReason}
            onClick={() => {
              onManualRetry?.();
            }}
          />

          {isServerTerminate && onSafeLogout !== undefined && (
            <IconControlButton
              iconId="session.end"
              ariaLabel="Безопасный выход"
              tooltipLabel="Безопасный выход"
              testId="control-safe-logout"
              className={styles["iconButton"]}
              disabledReason={safeLogoutDisabledReason}
              onClick={() => {
                onSafeLogout();
              }}
            />
          )}
        </div>

        {retryDisabledReason !== null && (
          <p className={styles["disabledReason"]} role="status">
            {retryDisabledReason}
          </p>
        )}
      </section>
    </div>
  );
}

function formatCountdownMessage(seconds: number): string {
  const mod10 = seconds % 10;
  const mod100 = seconds % 100;
  let suffix = "секунд";
  if (mod100 < 11 || mod100 > 14) {
    if (mod10 === 1) {
      suffix = "секунду";
    } else if (mod10 >= 2 && mod10 <= 4) {
      suffix = "секунды";
    }
  }
  return `Следующая попытка через ${seconds} ${suffix}`;
}

function resolveOverlayTitle(
  connectionState: ConnectionState,
  sipRecoveryMode: SipRecoveryMode | null,
): string {
  switch (connectionState) {
    case "ocp_disconnected":
      return "Соединение OCP потеряно";
    case "sip_disconnected":
      return "Соединение SIP потеряно";
    case "sip_registration_failed":
      return "Ошибка регистрации SIP";
    case "reconnecting":
      return sipRecoveryMode === "registration" ? "Перерегистрация SIP" : "Переподключение";
    case "reconnect_failed":
      return "Не удалось восстановить соединение";
    case "manual_retry_available":
      return "Ошибка подключения";
    case "server_terminate":
      return "Сессия завершена";
    default:
      return "Состояние подключения";
  }
}

function buildChannelRows(input: Readonly<{
  connectionState: ConnectionState;
  sipRecoveryMode: SipRecoveryMode | null;
  showOcpRow: boolean;
  showSipRow: boolean;
  ocpReconnectAttempt: number | null;
  sipReconnectAttempt: number | null;
  ocpMaxAttempts: number;
  sipMaxAttempts: number;
}>): ReadonlyArray<ConnectionChannelRow> {
  const rows: ConnectionChannelRow[] = [];

  if (input.showOcpRow) {
    rows.push({
      channel: "OCP",
      statusLabel: resolveChannelStatus(
        "OCP",
        input.connectionState,
        null,
        input.ocpReconnectAttempt,
      ),
      attempt: input.ocpReconnectAttempt,
      maxAttempts: input.ocpMaxAttempts,
    });
  }

  if (input.showSipRow) {
    rows.push({
      channel: "SIP",
      statusLabel: resolveChannelStatus(
        "SIP",
        input.connectionState,
        input.sipRecoveryMode,
        input.sipReconnectAttempt,
      ),
      attempt: input.sipReconnectAttempt,
      maxAttempts: input.sipMaxAttempts,
    });
  }

  return rows;
}

function resolveChannelStatus(
  channel: "OCP" | "SIP",
  connectionState: ConnectionState,
  sipRecoveryMode: SipRecoveryMode | null,
  attempt: number | null,
): string {
  if (connectionState === "server_terminate") {
    return "Сессия завершена";
  }

  if (connectionState === "sip_registration_failed") {
    return channel === "SIP" ? "Ошибка регистрации" : "Отключено";
  }

  if (connectionState === "reconnecting" && attempt !== null) {
    if (channel === "SIP" && sipRecoveryMode === "registration") {
      return "Перерегистрация";
    }
    return "Переподключение";
  }

  if (connectionState === "reconnect_failed" && attempt !== null) {
    return "Ошибка";
  }

  if (channel === "OCP" && connectionState === "ocp_disconnected") {
    return "Отключено";
  }

  if (channel === "SIP" && connectionState === "sip_disconnected") {
    return "Отключено";
  }

  return "Недоступно";
}
