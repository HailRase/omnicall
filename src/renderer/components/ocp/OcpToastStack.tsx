import type { JSX } from "react";
import type { OcpToastItem } from "@application/index.js";

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
      className="ocp-toast-stack"
      aria-label="OCP notifications"
      data-testid="ocp-toast-stack"
    >
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`ocp-toast ocp-toast--${toast.level}`}
          data-testid="ocp-toast"
          role="status"
          aria-live="polite"
        >
          <p className="ocp-toast__message">{toast.message}</p>
          <button
            type="button"
            className="ocp-toast__dismiss"
            aria-label="Dismiss notification"
            onClick={() => {
              onDismiss(toast.id);
            }}
          >
            Dismiss
          </button>
        </article>
      ))}
    </section>
  );
}
