import type { JSX, ReactNode } from "react";
import { IconControlButton } from "../icons/index.js";
import styles from "./ShellOverlaySheet.module.css";

export type ShellOverlaySheetProps = Readonly<{
  open: boolean;
  title: string;
  testId: string;
  onClose: () => void;
  children?: ReactNode;
}>;

/**
 * - Purpose: portal-style overlay sheet stub for settings and diagnostics (WU0).
 * - Inputs: open flag, title, close callback, optional body content.
 * - Outputs: semi-modal panel rendered in OverlayLayer without unmounting context.
 * @uiMeta f=F-016 smoke=settings-overlay,diagnostics-overlay
 */
export function ShellOverlaySheet({
  open,
  title,
  testId,
  onClose,
  children,
}: ShellOverlaySheetProps): JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div
      className={styles["sheet"]}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className={styles["backdrop"]}
        aria-label="Close overlay"
        onClick={onClose}
      />
      <section className={styles["panel"]}>
        <header className={styles["header"]}>
          <h2 className={styles["title"]}>{title}</h2>
          <IconControlButton
            iconId="overlay.close"
            ariaLabel={`Close ${title}`}
            testId={`${testId}-close`}
            className={styles["closeButton"]}
            onClick={onClose}
          />
        </header>
        <div className={styles["body"]}>
          {children ?? (
            <p className={styles["placeholder"]} data-testid={`${testId}-placeholder`}>
              Content will be added in a later work unit.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
