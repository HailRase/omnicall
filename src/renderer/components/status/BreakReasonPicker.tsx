import type { JSX } from "react";
import { RejectReasonSelector } from "../call/RejectReasonSelector.js";

export type BreakReasonPickerProps = Readonly<{
  reasons: ReadonlyArray<string>;
  selectedReason: string | null;
  confirmDisabled: boolean;
  onSelect: (reason: string) => void;
  onConfirm: () => void;
}>;

/**
 * - Purpose: render break reason selection before agent break status change (LF-043).
 * - Inputs: allowed reasons, selection state, and select/confirm callbacks.
 * - Outputs: break reason picker UI reusing incoming-call reject pattern.
 */
export function BreakReasonPicker({
  reasons,
  selectedReason,
  confirmDisabled,
  onSelect,
  onConfirm,
}: BreakReasonPickerProps): JSX.Element {
  return (
    <div className="break-reason-picker" data-testid="break-reason-picker">
      <RejectReasonSelector
        reasons={reasons}
        selectedReason={selectedReason}
        required
        disabled={false}
        onSelect={onSelect}
      />
      <button
        type="button"
        data-testid="control-confirm-break"
        aria-label="Confirm break with selected reason"
        disabled={confirmDisabled}
        onClick={onConfirm}
      >
        Confirm break
      </button>
    </div>
  );
}
