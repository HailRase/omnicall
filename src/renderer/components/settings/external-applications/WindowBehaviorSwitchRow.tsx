/**
 * - Purpose: switch row with compact illustrated desktop preview.
 * - Inputs: checked, disabled, labels, hint, change callback, schematic.
 * - Outputs: presentational FormField Switch plus aria-hidden outcome preview.
 */

import type { JSX, ReactNode } from "react";
import { FormField, Switch } from "../../ui/index.js";
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
  return (
    <div className={styles.row} data-testid={testId} data-active={checked ? "true" : "false"}>
      <div className={styles.controls}>
        <FormField label={label} hint={hint}>
          <Switch
            checked={checked}
            disabled={disabled}
            aria-label={label}
            onCheckedChange={onCheckedChange}
          />
        </FormField>
      </div>
      <div className={styles.preview} aria-hidden="true">
        {schematic}
      </div>
    </div>
  );
}
