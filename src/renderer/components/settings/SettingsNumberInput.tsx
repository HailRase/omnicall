import clsx from "clsx";
import type { ChangeEvent, JSX, ReactNode } from "react";
import { Input } from "../ui/index.js";
import styles from "./SettingsNumberInput.module.css";

export type SettingsNumberInputProps = Readonly<{
  id: string;
  value: number;
  min: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  invalid?: boolean;
  suffix?: ReactNode;
  suffixAccessibleId?: string;
  suffixAccessibleLabel?: string;
  touchTarget?: boolean;
  className?: string;
  "data-testid"?: string;
  "aria-describedby"?: string;
  onChange: (value: number) => void;
}>;

/**
 * - Purpose: compact settings numeric field built on UI Kit Input.
 * - Inputs: bounds, suffix, validation state, and change callback.
 * - Outputs: inline number control aligned with settings field rows.
 */
export function SettingsNumberInput({
  id,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  invalid = false,
  suffix,
  suffixAccessibleId,
  suffixAccessibleLabel,
  touchTarget = false,
  className,
  "data-testid": testId,
  "aria-describedby": ariaDescribedBy,
  onChange,
}: SettingsNumberInputProps): JSX.Element {
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const parsed = Number.parseInt(event.target.value, 10);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  }

  return (
    <div
      className={clsx(
        styles.root,
        touchTarget && styles.touchTarget,
        className,
      )}
    >
      <Input
        id={id}
        type="number"
        size="md"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        invalid={invalid}
        suffix={suffix}
        className={clsx(styles.compactInput, invalid && styles.compactInputInvalid)}
        data-testid={testId}
        {...(disabled ? { "aria-disabled": true } : {})}
        {...(ariaDescribedBy !== undefined ? { "aria-describedby": ariaDescribedBy } : {})}
        onChange={handleChange}
      />
      {suffixAccessibleLabel !== undefined && suffixAccessibleId !== undefined ? (
        <span id={suffixAccessibleId} className={styles.suffixAccessible}>
          {suffixAccessibleLabel}
        </span>
      ) : null}
    </div>
  );
}
