import type { JSX } from "react";
import type { CallLineCardViewModel } from "@application/index.js";

export type CallLineCardProps = Readonly<{
  line: CallLineCardViewModel;
  onResume: (callId: string) => void;
  onHangup: (callId: string) => void;
}>;

/**
 * - Purpose: present one call line row with state badges and controls.
 * - Inputs: line view-model and resume/hangup callbacks.
 * - Outputs: accessible card UI without business logic.
 */
export function CallLineCard({ line, onResume, onHangup }: CallLineCardProps): JSX.Element {
  return (
    <li
      className="call-line-card"
      data-testid={`call-line-${line.callId}`}
      aria-label={`Call line ${line.callId}`}
    >
      <span className="call-line-card__role">{mapRoleLabel(line.role)}</span>
      <span className="call-line-card__state">{line.state}</span>
      {line.muted ? (
        <span className="call-line-card__badge" data-testid={`call-line-muted-${line.callId}`}>
          Muted
        </span>
      ) : null}
      {line.state === "Held" ? (
        <button
          type="button"
          data-testid={`control-resume-line-${line.callId}`}
          disabled={line.resumeDisabledReason !== null}
          aria-label={`Resume call ${line.callId}`}
          onClick={() => {
            onResume(line.callId);
          }}
        >
          Resume
        </button>
      ) : null}
      <button
        type="button"
        data-testid={`control-hangup-line-${line.callId}`}
        disabled={line.hangupDisabledReason !== null}
        aria-label={`Hang up call ${line.callId}`}
        onClick={() => {
          onHangup(line.callId);
        }}
      >
        Hang up
      </button>
      {line.resumeDisabledReason !== null ? (
        <span className="call-line-card__disabled-reason">{line.resumeDisabledReason}</span>
      ) : null}
    </li>
  );
}

function mapRoleLabel(role: CallLineCardViewModel["role"]): string {
  switch (role) {
    case "source":
      return "Source";
    case "consultation":
      return "Consultation";
    case "primary":
      return "Primary";
  }
}
