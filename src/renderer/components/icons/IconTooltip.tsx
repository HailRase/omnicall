import { autoUpdate, flip, offset, shift, type Placement } from "@floating-ui/dom";
import { useFloating } from "@floating-ui/react-dom";
import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./IconTooltip.module.css";
import { resolveIconTooltipDelayMs } from "./iconTooltipDelay.js";

const TOOLTIP_OFFSET_PX = 4;
const VIEWPORT_PADDING_PX = 8;

export type IconTooltipProps = Readonly<{
  label: string;
  children: ReactNode;
  className?: string | undefined;
  placement?: Placement | undefined;
}>;

/**
 * - Purpose: show delayed hover tooltip for icon-only controls with viewport-aware placement.
 * - Inputs: tooltip label, single focusable child element, optional floating placement.
 * - Outputs: portal tooltip bubble after configured delay, auto-flipped within viewport.
 */
export function IconTooltip({
  label,
  children,
  className,
  placement = "top",
}: IconTooltipProps): JSX.Element {
  const tooltipId = useId();
  const showTimeoutRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  const { refs, floatingStyles, placement: resolvedPlacement, update } = useFloating({
    placement,
    open: visible,
    middleware: [
      offset(TOOLTIP_OFFSET_PX),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: VIEWPORT_PADDING_PX }),
    ],
  });

  useEffect(() => {
    if (!visible) {
      return;
    }

    void update();
  }, [visible, update]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const reference = refs.reference.current;
    const floating = refs.floating.current;
    if (reference === null || floating === null) {
      return;
    }

    return autoUpdate(reference, floating, update);
  }, [visible, refs.reference, refs.floating, update]);

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
    return <span className={clsx(styles.host, className)}>{children}</span>;
  }

  const tooltipNode =
    visible && typeof document !== "undefined"
      ? createPortal(
          <span
            id={tooltipId}
            ref={refs.setFloating}
            role="tooltip"
            className={styles.tooltip}
            style={floatingStyles}
            data-placement={resolvedPlacement}
            data-testid="icon-tooltip-bubble"
          >
            {label}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={refs.setReference}
        className={clsx(styles.host, className)}
        data-testid="icon-tooltip-host"
        onPointerEnter={showTooltip}
        onPointerLeave={hideTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </span>
      {tooltipNode}
    </>
  );
}
