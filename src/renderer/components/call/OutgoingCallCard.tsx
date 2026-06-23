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

export function OutgoingCallCard({
  callId,
  callState,
  uiState,
  toneIndicator,
  numberValue,
  lastError,
  lastDtmfTone,
}: OutgoingCallCardProps): JSX.Element {
  if (callId === null && callState === "Idle") {
    return (
      <section className="outgoing-card" data-testid="outgoing-call-card">
        <h2>Outgoing call</h2>
        <p>No active outgoing call.</p>
      </section>
    );
  }

  return (
    <section className="outgoing-card" data-testid="outgoing-call-card">
      <h2>Outgoing call</h2>
      <p data-testid="call-state-label">
        <strong>State:</strong> {callState}
      </p>
      <p data-testid="tone-state-indicator">
        <strong>Tone:</strong> {toneIndicator}
      </p>
      <p data-testid="call-ui-state-label">
        <strong>UI state:</strong> {uiState}
      </p>
      <p>
        <strong>Target:</strong> {numberValue || "Unknown"}
      </p>
      <p>
        <strong>Call ID:</strong> {callId ?? "N/A"}
      </p>
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

