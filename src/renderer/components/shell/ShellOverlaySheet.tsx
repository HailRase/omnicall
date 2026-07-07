import clsx from "clsx";
import { useEffect, type JSX, type ReactNode } from "react";
import { useI18n } from "../../i18n/index.js";
import { Button } from "../ui/button/Button.js";
import { IconControlButton } from "../icons/index.js";
import styles from "./ShellOverlaySheet.module.css";

export type ShellOverlayPresentation = "sidebar" | "fullPanel";

export type ShellOverlaySheetProps = Readonly<{
  open: boolean;
  title: string;
  testId: string;
  closeButtonTestId?: string;
  backButtonTestId?: string;
  presentation?: ShellOverlayPresentation;
  showBack?: boolean;
  onClose: () => void;
  onBack?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}>;

/**
 * - Purpose: canonical sidebar/full-panel overlay host for OverlayLayer route panels.
 * - Inputs: open flag, title, presentation, optional back/footer slots, close callback.
 * - Outputs: semi-modal sheet anchored inside SoftphoneLayout overlays without remounting call zones.
 */
export function ShellOverlaySheet({
  open,
  title,
  testId,
  closeButtonTestId,
  backButtonTestId,
  presentation = "sidebar",
  showBack = false,
  onClose,
  onBack,
  children,
  footer,
}: ShellOverlaySheetProps): JSX.Element | null {
  const { t } = useI18n();
  const resolvedCloseTestId = closeButtonTestId ?? `${testId}-close`;
  const resolvedBackTestId = backButtonTestId ?? `${testId}-back`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const isSidebarPresentation = presentation === "sidebar";

  return (
    <div
      className={clsx(styles.sheet, !isSidebarPresentation ? styles.sheetFullPanel : undefined)}
      data-testid={testId}
      data-shell-overlay-interactive="true"
      data-shell-overlay-presentation={presentation}
      role="dialog"
      aria-modal={isSidebarPresentation ? "false" : "true"}
      aria-label={title}
    >
      <button
        type="button"
        className={clsx(
          styles.backdrop,
          isSidebarPresentation ? styles.backdropSidebar : undefined,
        )}
        aria-label={t("shell.overlay.closePanelAria")}
        aria-hidden={isSidebarPresentation ? "true" : undefined}
        tabIndex={isSidebarPresentation ? -1 : undefined}
        onClick={isSidebarPresentation ? undefined : onClose}
      />
      <section
        className={clsx(
          styles.panel,
          presentation === "fullPanel" ? styles.panelFull : styles.panelSidebar,
          footer !== undefined ? styles.panelWithFooter : undefined,
        )}
      >
        <header className={styles.header}>
          <div className={styles.headerMain}>
            {showBack && onBack !== undefined ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid={resolvedBackTestId}
                onClick={onBack}
              >
                {t("shell.overlay.back")}
              </Button>
            ) : null}
            <h2 className={styles.title}>{title}</h2>
          </div>
          <IconControlButton
            iconId="overlay.close"
            ariaLabel={t("shell.overlay.closeTitleAria", { title })}
            testId={resolvedCloseTestId}
            className={styles.closeButton}
            onClick={onClose}
          />
        </header>
        <div className={styles.body}>
          {children ?? (
            <p className={styles.placeholder} data-testid={`${testId}-placeholder`}>
              {t("shell.overlay.placeholder")}
            </p>
          )}
        </div>
        {footer !== undefined ? <footer className={styles.footer}>{footer}</footer> : null}
      </section>
    </div>
  );
}
