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
 * - Outputs: compact status card for connecting or failed outgoing attempts.
 */
export function OutgoingCallCard({
  callId,
  callState,
  uiState,
  toneIndicator,
  numberValue,
  lastError,
  lastDtmfTone,
}: OutgoingCallCardProps): JSX.Element {
  return (
    <section className={styles["card"]} data-testid="outgoing-call-card">
      <h2 className={styles["title"]}>
        <span className={styles["titleIcon"]}>
          <AppIcon id="call.outgoing" decorative />
        </span>
        Исходящий звонок
      </h2>
      <p data-testid="call-state-label">
        <strong>Состояние:</strong> {mapCallStateLabel(callState)}
      </p>
      {toneIndicator !== "none" ? (
        <p data-testid="tone-state-indicator">
          <strong>Сигнал:</strong> {mapToneLabel(toneIndicator)}
        </p>
      ) : null}
      <p data-testid="call-ui-state-label">
        <strong>UI:</strong> {uiState}
      </p>
      <p>
        <strong>Номер:</strong> {numberValue || "Неизвестно"}
      </p>
      {callId !== null ? (
        <p>
          <strong>ID звонка:</strong> {callId}
        </p>
      ) : null}
      {lastDtmfTone !== null && (
        <p>
          <strong>Последний DTMF:</strong> {lastDtmfTone}
        </p>
      )}
      {lastError !== null && (
        <p className={styles["error"]} data-testid="call-failed-alert" role="alert">
          {lastError}
        </p>
      )}
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
