import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import { RejectReasonSelector } from "../call/RejectReasonSelector.js";
import { IconControlButton } from "../icons/index.js";
import styles from "./BreakReasonPicker.module.css";

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
  const { t } = useI18n();
  return (
    <div className={styles.picker} data-testid="break-reason-picker">
      <RejectReasonSelector
        reasons={reasons}
        selectedReason={selectedReason}
        required
        disabled={false}
        onSelect={onSelect}
      />
      <IconControlButton
        iconId="action.confirm"
        ariaLabel={t("status.break.confirmAria")}
        tooltipLabel={t("status.break.confirmTooltip")}
        testId="control-confirm-break"
        className={styles.iconButton}
        disabled={confirmDisabled}
        onClick={onConfirm}
      />
    </div>
  );
}
