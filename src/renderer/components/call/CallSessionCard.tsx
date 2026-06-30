import clsx from "clsx";
import type { JSX } from "react";
import type { CallLineCardViewModel } from "@application/index.js";
import { useCallDuration } from "../../hooks/useCallDuration.js";
import { mapQueueLabelState } from "../../helpers/mapQueueLabelState.js";
import { AppIcon } from "../icons/AppIcon.js";
import type { IconSemanticId } from "../icons/iconCatalog.js";
import styles from "./CallSessionCard.module.css";

export type CallSessionCardProps = Readonly<{
  line: CallLineCardViewModel;
  isActive?: boolean;
  compact?: boolean;
  showSelectionChrome?: boolean;
  onClick?: () => void;
}>;

/**
 * - Purpose: reference-aligned session card for single or compact multi-line display.
 * - Inputs: line view-model, active/compact flags, optional select callback.
 * - Outputs: accessible session summary without inline control actions.
 * @uiMeta lf=LF-011,LF-021 f=F-016 smoke=R7-*
 */
export function CallSessionCard({
  line,
  isActive = false,
  compact = false,
  showSelectionChrome,
  onClick,
}: CallSessionCardProps): JSX.Element {
  const duration = useCallDuration(line.durationStartedAt);
  const queueLabel = mapQueueLabelState(line.queueLabelState, line.queueName);
  const isLocallyHeld = line.showLocalHoldBadge;
  const isRemoteHeld = line.showRemoteHoldBadge;
  const isHeld = isLocallyHeld;
  const isRinging = line.state === "Ringing" || line.state === "Connecting";
  const isFailed = line.state === "Failed";
  const directionIconId = resolveDirectionIconId(line);
  const selectionChromeVisible = showSelectionChrome ?? compact;
  const showSelectedChrome = selectionChromeVisible && isActive;
  const statusHint =
    showSelectedChrome && isHeld
      ? `${line.statusLabel} · выбран`
      : line.statusLabel;

  if (compact) {
    return (
      <button
        type="button"
        className={clsx(
          styles["compact"],
          isActive && styles["compactActive"],
          isHeld && styles["compactHeld"],
          showSelectedChrome && styles["compactSelected"],
        )}
        data-testid={`call-session-card-${line.callId}`}
        aria-label={buildCompactAriaLabel(line)}
        aria-selected={showSelectedChrome ? true : undefined}
        onClick={onClick}
      >
        <span
          className={clsx(styles["avatar"], isHeld && styles["avatarHeld"])}
          aria-hidden
        >
          <AppIcon id={directionIconId} size={13} decorative />
        </span>
        <span className={styles["compactBody"]}>
          <span className={styles["compactTitleRow"]}>
            <span className={styles["compactName"]}>{line.displayName}</span>
            {line.muted ? (
              <span
                className={styles["compactMute"]}
                data-testid={`call-session-muted-${line.callId}`}
                aria-hidden
              >
                <AppIcon id="call.mute" size={10} decorative />
              </span>
            ) : null}
          </span>
          <span
            className={clsx(styles["compactStatus"], isHeld && styles["statusHeld"])}
            data-testid={`call-session-status-${line.callId}`}
          >
            {statusHint}
          </span>
        </span>
        <span className={styles["compactAside"]}>
          {isRemoteHeld ? (
            <span
              className={styles["compactRemoteHold"]}
              data-testid={`call-session-remote-hold-${line.callId}`}
            >
              <AppIcon id="call.hold" size={10} decorative />
              Удержание (удал.)
            </span>
          ) : null}
          {duration.length > 0 ? (
            <span
              className={styles["duration"]}
              data-testid={`call-session-duration-${line.callId}`}
            >
              {duration}
            </span>
          ) : null}
          {queueLabel.visible ? (
            <span className={styles["queueBadge"]}>{queueLabel.text}</span>
          ) : null}
        </span>
      </button>
    );
  }

  const cardClassName = clsx(
    styles["card"],
    isFailed && styles["cardFailed"],
    isHeld && styles["cardHeld"],
    isActive && styles["cardActive"],
    showSelectedChrome && styles["cardSelected"],
    onClick !== undefined && styles["cardSelectable"],
  );

  const cardBody = (
    <>
      <div className={styles["headerRow"]}>
        <div className={styles["identity"]}>
          <span
            className={clsx(styles["avatar"], isHeld && styles["avatarHeld"])}
            aria-hidden
          >
            <AppIcon id={directionIconId} size={16} decorative />
          </span>
          <span className={styles["identityText"]}>
            <span className={styles["name"]}>{line.displayName}</span>
          </span>
        </div>
        {duration.length > 0 ? (
          <span
            className={styles["durationRow"]}
            data-testid={`call-session-duration-${line.callId}`}
          >
            <span className={styles["duration"]}>{duration}</span>
          </span>
        ) : null}
      </div>

      {queueLabel.visible ? (
        <div className={styles["badges"]}>
          <span className={styles["queueBadge"]}>{queueLabel.text}</span>
        </div>
      ) : null}

      <div className={styles["footerRow"]}>
        <span className={styles["statusGroup"]}>
          {isRinging ? <span className={styles["pulse"]} aria-hidden /> : null}
          <span
            className={clsx(
              styles["statusLabel"],
              isHeld && styles["statusHeld"],
              isRinging && styles["statusRinging"],
              isFailed && styles["statusFailed"],
            )}
            data-testid={`call-session-status-${line.callId}`}
          >
            {statusHint}
          </span>
        </span>
        <span className={styles["badgeRow"]}>
          {line.muted ? (
            <span
              className={styles["muteBadge"]}
              data-testid={`call-session-muted-${line.callId}`}
            >
              <AppIcon id="call.mute" size={10} decorative />
              Микрофон выкл
            </span>
          ) : null}
          {isLocallyHeld ? (
            <span className={styles["holdBadge"]}>
              <AppIcon id="call.hold" size={10} decorative />
              Удержание
            </span>
          ) : null}
          {isRemoteHeld ? (
            <span
              className={styles["remoteHoldBadge"]}
              data-testid={`call-session-remote-hold-${line.callId}`}
            >
              <AppIcon id="call.hold" size={10} decorative />
              Удержание (удал.)
            </span>
          ) : null}
        </span>
      </div>
    </>
  );

  if (onClick !== undefined) {
    return (
      <button
        type="button"
        className={cardClassName}
        data-testid={`call-session-card-${line.callId}`}
        aria-label={`Выбрать звонок ${line.displayName}`}
        aria-selected={showSelectedChrome ? true : undefined}
        onClick={onClick}
      >
        {cardBody}
      </button>
    );
  }

  return (
    <article
      className={cardClassName}
      data-testid={`call-session-card-${line.callId}`}
      aria-label={`Звонок ${line.displayName}`}
    >
      {cardBody}
    </article>
  );
}

function resolveDirectionIconId(line: CallLineCardViewModel): IconSemanticId {
  if (line.role === "consultation") {
    return "transfer.consultation";
  }
  if (line.state === "Ringing" && line.primaryAction === "answer") {
    return "call.incoming";
  }
  return "call.outgoing";
}

function buildCompactAriaLabel(line: CallLineCardViewModel): string {
  const base = `Выбрать звонок ${line.displayName}`;
  if (line.showLocalHoldBadge && line.showRemoteHoldBadge) {
    return `${base}, на удержании, собеседник на удержании`;
  }
  if (line.showLocalHoldBadge) {
    return `${base}, на удержании`;
  }
  if (line.showRemoteHoldBadge) {
    return `${base}, собеседник на удержании`;
  }
  return base;
}
