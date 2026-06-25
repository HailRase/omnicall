import type { JSX } from "react";

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
    <section className="outgoing-card" data-testid="outgoing-call-card">
      <h2>Outgoing call</h2>
      <p data-testid="call-state-label">
        <strong>State:</strong> {callState}
      </p>
      {toneIndicator !== "none" ? (
        <p data-testid="tone-state-indicator">
          <strong>Tone:</strong> {toneIndicator}
        </p>
      ) : null}
      <p data-testid="call-ui-state-label">
        <strong>UI state:</strong> {uiState}
      </p>
      <p>
        <strong>Target:</strong> {numberValue || "Unknown"}
      </p>
      {callId !== null ? (
        <p>
          <strong>Call ID:</strong> {callId}
        </p>
      ) : null}
      {lastDtmfTone !== null && (
        <p>
          <strong>Last DTMF:</strong> {lastDtmfTone}
        </p>
      )}
      {lastError !== null && (
        <p className="outgoing-card__error" data-testid="call-failed-alert" role="alert">
          {lastError}
        </p>
      )}
    </section>
  );
}
