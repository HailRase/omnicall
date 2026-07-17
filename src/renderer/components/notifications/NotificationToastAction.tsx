import { useLayoutEffect, useRef, useState, type JSX } from "react";
import { Tooltip } from "../ui/tooltip/Tooltip.js";
import styles from "./NotificationToast.module.css";

export type NotificationToastActionProps = Readonly<{
  label: string;
  onClick: () => void;
}>;

/**
 * - Purpose: Sonner toast action that yields space to message text and truncates long labels.
 * - Inputs: localized label and click handler.
 * - Outputs: button with wrap/ellipsis; tooltip only when label is visually truncated.
 */
export function NotificationToastAction({
  label,
  onClick,
}: NotificationToastActionProps): JSX.Element {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const node = labelRef.current;
    if (node === null) {
      setTruncated(false);
      return;
    }

    const measure = (): void => {
      setTruncated(
        node.scrollHeight > node.clientHeight + 1 ||
          node.scrollWidth > node.clientWidth + 1,
      );
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [label]);

  const button = (
    <button
      type="button"
      data-button=""
      data-action=""
      data-testid="notification-toast-action"
      className={styles.actionButton}
      onClick={onClick}
    >
      <span ref={labelRef} className={styles.actionLabel}>
        {label}
      </span>
    </button>
  );

  if (!truncated) {
    return button;
  }

  return (
    <Tooltip
      label={label}
      side="top"
      delayDuration={300}
      className={styles.actionTooltip}
    >
      {button}
    </Tooltip>
  );
}
