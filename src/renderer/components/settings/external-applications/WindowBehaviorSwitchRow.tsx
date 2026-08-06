/**
 * - Purpose: card-like switch item with illustrated desktop preview.
 * - Inputs: checked, disabled, labels, hint, change callback, schematic.
 * - Outputs: presentational Switch card matching openMode choice layout.
 */

import type { JSX, ReactNode } from "react";
import { useId } from "react";
import { Switch } from "../../ui/index.js";
import styles from "./WindowBehaviorSwitchPreview.module.css";

export type WindowBehaviorSwitchRowProps = Readonly<{
  checked: boolean;
  disabled: boolean;
  label: string;
  hint: string;
  testId: string;
  schematic: ReactNode;
  onCheckedChange: (checked: boolean) => void;
}>;

/**
 * @uiMeta f=F-032
 */
export function WindowBehaviorSwitchRow({
  checked,
  disabled,
  label,
  hint,
  testId,
  schematic,
  onCheckedChange,
}: WindowBehaviorSwitchRowProps): JSX.Element {
  const titleId = useId();
  const hintId = useId();

  return (
    <div
      className={styles.row}
      data-testid={testId}
      data-active={checked ? "true" : "false"}
      data-disabled={disabled ? "true" : undefined}
    >
      <div className={styles.header}>
        <Switch
          checked={checked}
          disabled={disabled}
          aria-labelledby={titleId}
          aria-describedby={hintId}
          onCheckedChange={onCheckedChange}
        />
        <span id={titleId} className={styles.title}>
          {label}
        </span>
      </div>
      <p id={hintId} className={styles.description}>
        {hint}
      </p>
      <div className={styles.preview} aria-hidden="true">
        {schematic}
      </div>
    </div>
  );
}
