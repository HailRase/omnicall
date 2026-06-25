import type { JSX } from "react";
import type { AgentStatus } from "@application/index.js";
import { agentStatusLabel } from "@application/index.js";
import type { OperatorStatusDisabledReason } from "@application/index.js";
import {
  mapOperatorStatusDisabledReasonWithFallback,
} from "../../helpers/mapOperatorStatusDisabledReason.js";
import { IconControlButton } from "../icons/index.js";
import { BreakReasonPicker } from "./BreakReasonPicker.js";
import styles from "./StatusSelector.module.css";

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
      className={styles["panel"]}
      data-testid="status-selector"
      aria-label="Operator status"
    >
      <p data-testid="status-selector-current">
        Agent status:{" "}
        <strong>{displayStatus === null ? "—" : agentStatusLabel(displayStatus)}</strong>
      </p>

      {statusChangeInProgress && (
        <p
          className={styles["progress"]}
          data-testid="status-change-in-progress"
          role="status"
          aria-live="polite"
        >
          Status change in progress…
        </p>
      )}

      {rejectionBanner !== null && (
        <div
          className={styles["rejection"]}
          data-testid="status-rejection-banner"
          role="alert"
        >
          <p>{rejectionBanner}</p>
        </div>
      )}

      <div className={styles["actions"]} role="group" aria-label="Change agent status">
        <IconControlButton
          iconId="operator.ready"
          ariaLabel="Change to Ready"
          testId="control-change-ready"
          className={styles["iconButton"]}
          disabledReason={
            readyDisabledReason === null
              ? null
              : mapOperatorStatusDisabledReasonWithFallback(readyDisabledReason)
          }
          onClick={onReady}
        />
        <IconControlButton
          iconId="operator.break"
          ariaLabel="Change to Break"
          testId="control-change-break"
          className={styles["iconButton"]}
          disabledReason={
            breakDisabledReason === null
              ? null
              : mapOperatorStatusDisabledReasonWithFallback(breakDisabledReason)
          }
          onClick={onBreak}
        />
        <IconControlButton
          iconId="operator.logout"
          ariaLabel="Logout from operator platform"
          testId="control-request-logout"
          className={styles["iconButton"]}
          disabled={statusChangeInProgress}
          onClick={onOpenLogout}
        />
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
    <p className={styles["disabledReason"]} data-testid="status-disabled-reason" role="status">
      {mapOperatorStatusDisabledReasonWithFallback(reason)}
    </p>
  );
}
