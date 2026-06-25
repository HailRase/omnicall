import clsx from "clsx";
import type { JSX } from "react";
import type { ConnectionState } from "@application/index.js";
import styles from "./ConnectionOverlay.module.css";

export type ConnectionChannelRow = Readonly<{
  channel: "OCP" | "SIP";
  statusLabel: string;
  attempt: number | null;
  maxAttempts: number;
}>;

export type ConnectionOverlayProps = Readonly<{
  connectionState: ConnectionState;
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
  safeLogoutDisabledReason = "Safe logout not available",
  onManualRetry,
  onSafeLogout,
}: ConnectionOverlayProps): JSX.Element | null {
  if (connectionState === "connected") {
    return null;
  }

  const title = resolveOverlayTitle(connectionState);
  const isServerTerminate = connectionState === "server_terminate";
  const role = isBlocking ? "alertdialog" : "region";

  const channelRows = buildChannelRows({
    connectionState,
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
        aria-label="Connection status"
        data-testid="connection-overlay"
        aria-modal={isBlocking ? "true" : undefined}
      >
        <h2 className={styles["title"]}>{title}</h2>

        {isServerTerminate && (
          <p className={styles["message"]} data-testid="connection-server-terminate">
            Your session was ended by the server. Please wait while the application reaches a safe
            state.
          </p>
        )}

        {lastFailureReason !== null && connectionState !== "reconnecting" && (
          <p className={styles["reason"]} role="status">
            {lastFailureReason}
          </p>
        )}

        <ul className={styles["channels"]} aria-label="Connection channels">
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
                  Attempt {row.attempt} of {row.maxAttempts}
                </span>
              )}
            </li>
          ))}
        </ul>

        {showCountdown && (
          <p
            className={styles["countdown"]}
            data-testid="reconnect-countdown"
            aria-live="polite"
          >
            Next attempt in {reconnectCountdownSeconds} second
            {reconnectCountdownSeconds === 1 ? "" : "s"}
          </p>
        )}

        {showInProgress && (
          <p
            className={styles["loading"]}
            data-testid="reconnect-in-progress"
            aria-live="polite"
            role="status"
          >
            Reconnecting now…
          </p>
        )}

        <div className={styles["actions"]}>
          <button
            type="button"
            data-testid="control-retry-connection"
            aria-label="Retry connection"
            disabled={retryDisabledReason !== null}
            onClick={() => {
              onManualRetry?.();
            }}
          >
            Retry connection
          </button>

          {isServerTerminate && onSafeLogout !== undefined && (
            <button
              type="button"
              data-testid="control-safe-logout"
              aria-label="Safe logout"
              disabled={safeLogoutDisabledReason !== null}
              title={safeLogoutDisabledReason ?? undefined}
              onClick={() => {
                onSafeLogout();
              }}
            >
              Safe logout
            </button>
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

function resolveOverlayTitle(connectionState: ConnectionState): string {
  switch (connectionState) {
    case "ocp_disconnected":
      return "OCP connection lost";
    case "sip_disconnected":
      return "SIP connection lost";
    case "reconnecting":
      return "Reconnecting";
    case "reconnect_failed":
      return "Connection could not be restored";
    case "manual_retry_available":
      return "Connection failed";
    case "server_terminate":
      return "Session ended";
    default:
      return "Connection status";
  }
}

function buildChannelRows(input: Readonly<{
  connectionState: ConnectionState;
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
      statusLabel: resolveChannelStatus("OCP", input.connectionState, input.ocpReconnectAttempt),
      attempt: input.ocpReconnectAttempt,
      maxAttempts: input.ocpMaxAttempts,
    });
  }

  if (input.showSipRow) {
    rows.push({
      channel: "SIP",
      statusLabel: resolveChannelStatus("SIP", input.connectionState, input.sipReconnectAttempt),
      attempt: input.sipReconnectAttempt,
      maxAttempts: input.sipMaxAttempts,
    });
  }

  return rows;
}

function resolveChannelStatus(
  channel: "OCP" | "SIP",
  connectionState: ConnectionState,
  attempt: number | null,
): string {
  if (connectionState === "server_terminate") {
    return "Session ended";
  }

  if (connectionState === "reconnecting" && attempt !== null) {
    return "Reconnecting";
  }

  if (connectionState === "reconnect_failed" && attempt !== null) {
    return "Failed";
  }

  if (channel === "OCP" && connectionState === "ocp_disconnected") {
    return "Disconnected";
  }

  if (channel === "SIP" && connectionState === "sip_disconnected") {
    return "Disconnected";
  }

  return "Unavailable";
}
