import clsx from "clsx";
import type { JSX } from "react";
import type { OcpToastItem } from "@application/index.js";
import { IconControlButton } from "../icons/index.js";
import styles from "./OcpToastStack.module.css";

export type OcpToastStackProps = Readonly<{
  toasts: ReadonlyArray<OcpToastItem>;
  onDismiss: (id: string) => void;
}>;

/**
 * - Purpose: present OCP toast notifications from projection (LF-059).
 * - Inputs: toast items and dismiss callback.
 * - Outputs: accessible stacked toast region.
 */
export function OcpToastStack({ toasts, onDismiss }: OcpToastStackProps): JSX.Element | null {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <section
      className={styles["stack"]}
      aria-label="OCP notifications"
      data-testid="ocp-toast-stack"
    >
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={clsx(
            styles["toast"],
            toast.level === "info" && styles["toastInfo"],
            toast.level === "warn" && styles["toastWarn"],
            toast.level === "error" && styles["toastError"],
          )}
          data-testid="ocp-toast"
          role="status"
          aria-live="polite"
        >
          <p className={styles["message"]}>{toast.message}</p>
          <IconControlButton
            iconId="overlay.close"
            ariaLabel="Dismiss notification"
            tooltipLabel="Dismiss"
            className={styles["dismiss"]}
            onClick={() => {
              onDismiss(toast.id);
            }}
          />
        </article>
      ))}
    </section>
  );
}
