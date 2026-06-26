import clsx from "clsx";
import type { JSX } from "react";
import { deriveCallLineStatusLabel } from "@application/index.js";
import { AppIcon } from "../icons/index.js";
import styles from "./OutgoingCallCard.module.css";

export type OutgoingCallCardProps = Readonly<{
  callId: string | null;
  callState: string;
  uiState: string;
  toneIndicator: "none" | "ringback" | "busy" | "failed";
  numberValue: string;
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
  lastError,
}: OutgoingCallCardProps): JSX.Element {
  const statusLabel = mapCallStateLabel(callState);
  const isFailed = callState === "Failed" || toneIndicator === "failed" || lastError !== null;

  return (
    <section
      className={clsx(styles["card"], isFailed && styles["cardFailed"])}
      data-testid="outgoing-call-card"
      aria-label="Исходящий звонок"
    >
      <div className={styles["header"]}>
        <span className={styles["avatar"]} aria-hidden>
          <AppIcon id="call.outgoing" size={16} decorative />
        </span>
        <div className={styles["identity"]}>
          <p className={styles["number"]}>{numberValue || "Неизвестный номер"}</p>
          <p className={styles["status"]} data-testid="call-state-label">
            {toneIndicator !== "none" ? mapToneLabel(toneIndicator) : statusLabel}
          </p>
        </div>
      </div>
      {lastError !== null ? (
        <p className={styles["error"]} data-testid="call-failed-alert" role="alert">
          {lastError}
        </p>
      ) : null}
    </section>
  );
}

function mapCallStateLabel(callState: string): string {
  if (callState === "Idle") {
    return deriveCallLineStatusLabel({ state: "Idle" });
  }
  return deriveCallLineStatusLabel({
    state: callState as Parameters<typeof deriveCallLineStatusLabel>[0]["state"],
  });
}

function mapToneLabel(tone: "ringback" | "busy" | "failed"): string {
  switch (tone) {
    case "ringback":
      return "Гудки";
    case "busy":
      return "Занято";
    case "failed":
      return "Ошибка";
  }
}
