import type { JSX, ReactNode } from "react";

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
      className="shell-overlay-sheet"
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="shell-overlay-sheet__backdrop"
        aria-label="Close overlay"
        onClick={onClose}
      />
      <section className="shell-overlay-sheet__panel">
        <header className="shell-overlay-sheet__header">
          <h2 className="shell-overlay-sheet__title">{title}</h2>
          <button
            type="button"
            className="shell-overlay-sheet__close"
            data-testid={`${testId}-close`}
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            Close
          </button>
        </header>
        <div className="shell-overlay-sheet__body">
          {children ?? (
            <p className="shell-overlay-sheet__placeholder" data-testid={`${testId}-placeholder`}>
              Content will be added in a later work unit.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
