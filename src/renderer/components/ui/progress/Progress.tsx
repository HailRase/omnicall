import * as ProgressPrimitive from "@radix-ui/react-progress";
import clsx from "clsx";
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type CSSProperties,
  type JSX,
  type Ref,
} from "react";
import type { ProgressTone } from "../types.js";
import styles from "./Progress.module.css";

const DEFAULT_MAX = 100;

export type ProgressProps = Readonly<
  Omit<
    ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    "className" | "value" | "max"
  > & {
    className?: string;
    value: number | null;
    max?: number;
    label?: string;
    tone?: ProgressTone;
  }
>;

const TONE_CLASS: Record<ProgressTone, string> = {
  default: styles.toneDefault ?? "",
  success: styles.toneSuccess ?? "",
  warning: styles.toneWarning ?? "",
  destructive: styles.toneDestructive ?? "",
};

function resolveIndicatorTransform(value: number | null, max: number): CSSProperties | undefined {
  if (value === null) {
    return undefined;
  }

  const percent = max > 0 ? (value / max) * 100 : 0;
  return { transform: `translateX(-${100 - percent}%)` };
}

/**
 * - Purpose: determinate or indeterminate progress indicator with optional label and tone.
 * - Inputs: value, max, label, tone, className, and Radix progress root props.
 * - Outputs: accessible progressbar surface with animated fill indicator.
 */
export const Progress = forwardRef(function Progress(
  {
    className,
    value,
    max = DEFAULT_MAX,
    label,
    tone = "default",
    ...rest
  }: ProgressProps,
  ref: Ref<ComponentRef<typeof ProgressPrimitive.Root>>,
): JSX.Element {
  const labelId = useId();
  const indicatorStyle = resolveIndicatorTransform(value, max);
  const hasLabel = label !== undefined && label.length > 0;

  const progressBar = (
    <ProgressPrimitive.Root
      className={clsx(styles.root, TONE_CLASS[tone], className)}
      {...rest}
      ref={ref}
      value={value}
      max={max}
      data-tone={tone}
      {...(hasLabel ? { "aria-labelledby": labelId } : {})}
    >
      <ProgressPrimitive.Indicator
        className={styles.indicator}
        {...(indicatorStyle !== undefined ? { style: indicatorStyle } : {})}
      />
    </ProgressPrimitive.Root>
  );

  if (!hasLabel) {
    return progressBar;
  }

  return (
    <div className={styles.wrapper}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {progressBar}
    </div>
  );
});
