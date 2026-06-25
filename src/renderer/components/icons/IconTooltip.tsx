import clsx from "clsx";
import { useCallback, useEffect, useId, useRef, useState, type JSX, type ReactNode } from "react";
import styles from "./IconTooltip.module.css";
import { resolveIconTooltipDelayMs } from "./iconTooltipDelay.js";

export type IconTooltipProps = Readonly<{
  label: string;
  children: ReactNode;
  className?: string | undefined;
}>;

/**
 * - Purpose: show delayed hover tooltip for icon-only controls.
 * - Inputs: tooltip label and single focusable child element.
 * - Outputs: wrapper with role=tooltip bubble after configured delay.
 */
export function IconTooltip({ label, children, className }: IconTooltipProps): JSX.Element {
  const tooltipId = useId();
  const showTimeoutRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  const clearShowTimeout = useCallback((): void => {
    if (showTimeoutRef.current !== null) {
      window.clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
  }, []);

  const hideTooltip = useCallback((): void => {
    clearShowTimeout();
    setVisible(false);
  }, [clearShowTimeout]);

  const showTooltip = useCallback((): void => {
    clearShowTimeout();
    const delayMs = resolveIconTooltipDelayMs();
    if (delayMs === 0) {
      setVisible(true);
      return;
    }
    showTimeoutRef.current = window.setTimeout(() => {
      setVisible(true);
      showTimeoutRef.current = null;
    }, delayMs);
  }, [clearShowTimeout]);

  useEffect(() => {
    return () => {
      clearShowTimeout();
    };
  }, [clearShowTimeout]);

  if (label.length === 0) {
    return <>{children}</>;
  }

  return (
    <span
      className={clsx(styles["host"], className)}
      data-testid="icon-tooltip-host"
      onPointerEnter={showTooltip}
      onPointerLeave={hideTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {visible ? (
        <span id={tooltipId} role="tooltip" className={styles["tooltip"]}>
          {label}
        </span>
      ) : null}
    </span>
  );
}
