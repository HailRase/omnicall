import clsx from "clsx";
import type { JSX } from "react";
import { deriveCallLineStatusLabel } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/index.js";
import styles from "./OutgoingCallCard.module.css";

export type OutgoingCallCardProps = Readonly<{
  callId: string | null;
  callState: string;
  uiState: string;
  toneIndicator: "none" | "ringback" | "busy" | "failed";
  numberValue: string;
  displayName?: string | null;
  lastError: string | null;
  lastDtmfTone: string | null;
}>;

/**
 * - Purpose: show pre-connect progress and failure details before a call line row exists.
 * - Inputs: call projection fields and dialed number.
 * - Outputs: operator-facing status card without technical diagnostics.
 */
export function OutgoingCallCard({
  callState,
  toneIndicator,
  numberValue,
  displayName = null,
  lastError,
}: OutgoingCallCardProps): JSX.Element {
  const { t } = useI18n();
  const statusLabel = mapCallStateLabel(t, callState);
  const isFailed = callState === "Failed" || toneIndicator === "failed" || lastError !== null;
  const trimmedName = displayName?.trim() ?? "";
  const trimmedNumber = numberValue.trim();
  const primaryLabel =
    trimmedName.length > 0
      ? trimmedName
      : trimmedNumber.length > 0
        ? trimmedNumber
        : t("outgoing.unknownNumber");
  const secondaryNumber =
    trimmedName.length > 0 && trimmedNumber.length > 0 && trimmedName !== trimmedNumber
      ? trimmedNumber
      : null;

  return (
    <section
      className={clsx(styles.card, isFailed && styles.cardFailed)}
      data-testid="outgoing-call-card"
      aria-label={t("outgoing.ariaLabel")}
    >
      <div className={styles.header}>
        <span className={styles.avatar} aria-hidden>
          <AppIcon id="call.outgoing" size={16} decorative />
        </span>
        <div className={styles.identity}>
          <p className={styles.number}>{primaryLabel}</p>
          {secondaryNumber !== null ? (
            <p className={styles.secondaryNumber}>{secondaryNumber}</p>
          ) : null}
          <p className={styles.status} data-testid="call-state-label">
            {toneIndicator !== "none" ? mapToneLabel(t, toneIndicator) : statusLabel}
          </p>
        </div>
      </div>
      {lastError !== null ? (
        <p className={styles.error} data-testid="call-failed-alert" role="alert">
          {lastError}
        </p>
      ) : null}
    </section>
  );
}

function mapCallStateLabel(t: ReturnType<typeof useI18n>["t"], callState: string): string {
  if (callState === "Idle") {
    return t("outgoing.state.idle");
  }
  return deriveCallLineStatusLabel({
    state: callState as Parameters<typeof deriveCallLineStatusLabel>[0]["state"],
  });
}

function mapToneLabel(
  t: ReturnType<typeof useI18n>["t"],
  tone: "ringback" | "busy" | "failed",
): string {
  switch (tone) {
    case "ringback":
      return t("outgoing.tone.ringback");
    case "busy":
      return t("outgoing.tone.busy");
    case "failed":
      return t("outgoing.tone.failed");
  }
}
