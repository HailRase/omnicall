import type { JSX } from "react";
import type { AgentStatus } from "@application/index.js";
import { agentStatusLabel } from "@application/index.js";
import type { OperatorStatusDisabledReason } from "@application/index.js";
import {
  mapOperatorStatusDisabledReasonWithFallback,
} from "../../helpers/mapOperatorStatusDisabledReason.js";
import { BreakReasonPicker } from "./BreakReasonPicker.js";

export type StatusSelectorProps = Readonly<{
  visible: boolean;
  currentStatus: AgentStatus | null;
  pendingStatus: AgentStatus | null;
  statusChangeInProgress: boolean;
  readyDisabledReason: OperatorStatusDisabledReason | null;
  breakDisabledReason: OperatorStatusDisabledReason | null;
  rejectionBanner: string | null;
  breakReasonPickerVisible: boolean;
  breakReasons: ReadonlyArray<string>;
  selectedBreakReason: string | null;
  onReady: () => void;
  onBreak: () => void;
  onSelectBreakReason: (reason: string) => void;
  onConfirmBreak: () => void;
  onOpenLogout: () => void;
}>;

/**
 * - Purpose: render presentational OCP operator status selector controls (LF-041).
 * - Inputs: projection flags, disabled reasons, rejection banner, and callbacks.
 * - Outputs: accessible status selector without business logic.
 */
export function StatusSelector({
  visible,
  currentStatus,
  pendingStatus,
  statusChangeInProgress,
  readyDisabledReason,
  breakDisabledReason,
  rejectionBanner,
  breakReasonPickerVisible,
  breakReasons,
  selectedBreakReason,
  onReady,
  onBreak,
  onSelectBreakReason,
  onConfirmBreak,
  onOpenLogout,
}: StatusSelectorProps): JSX.Element | null {
  if (!visible) {
    return null;
  }

  const displayStatus = pendingStatus ?? currentStatus;

  return (
    <section
      className="status-selector"
      data-testid="status-selector"
      aria-label="Operator status"
    >
      <p data-testid="status-selector-current">
        Agent status:{" "}
        <strong>{displayStatus === null ? "—" : agentStatusLabel(displayStatus)}</strong>
      </p>

      {statusChangeInProgress && (
        <p
          className="status-selector__progress"
          data-testid="status-change-in-progress"
          role="status"
          aria-live="polite"
        >
          Status change in progress…
        </p>
      )}

      {rejectionBanner !== null && (
        <div
          className="status-selector__rejection"
          data-testid="status-rejection-banner"
          role="alert"
        >
          <p>{rejectionBanner}</p>
        </div>
      )}

      <div className="status-selector__actions" role="group" aria-label="Change agent status">
        <button
          type="button"
          data-testid="control-change-ready"
          aria-label="Change to Ready"
          aria-disabled={readyDisabledReason !== null}
          title={
            readyDisabledReason === null
              ? undefined
              : mapOperatorStatusDisabledReasonWithFallback(readyDisabledReason)
          }
          disabled={readyDisabledReason !== null}
          onClick={onReady}
        >
          Ready
        </button>
        <button
          type="button"
          data-testid="control-change-break"
          aria-label="Change to Break"
          aria-disabled={breakDisabledReason !== null}
          title={
            breakDisabledReason === null
              ? undefined
              : mapOperatorStatusDisabledReasonWithFallback(breakDisabledReason)
          }
          disabled={breakDisabledReason !== null}
          onClick={onBreak}
        >
          Break
        </button>
        <button
          type="button"
          data-testid="control-request-logout"
          aria-label="Logout from operator platform"
          disabled={statusChangeInProgress}
          onClick={onOpenLogout}
        >
          Logout
        </button>
      </div>

      {breakReasonPickerVisible && (
        <BreakReasonPicker
          reasons={breakReasons}
          selectedReason={selectedBreakReason}
          confirmDisabled={selectedBreakReason === null || selectedBreakReason.length === 0}
          onSelect={onSelectBreakReason}
          onConfirm={onConfirmBreak}
        />
      )}

      {renderDisabledReason(readyDisabledReason, breakDisabledReason)}
    </section>
  );
}

function renderDisabledReason(
  readyReason: OperatorStatusDisabledReason | null,
  breakReason: OperatorStatusDisabledReason | null,
): JSX.Element | null {
  const reason = readyReason ?? breakReason;
  if (reason === null || reason === "break_reason_required") {
    return null;
  }

  return (
    <p data-testid="status-disabled-reason" role="status">
      {mapOperatorStatusDisabledReasonWithFallback(reason)}
    </p>
  );
}
