import clsx from "clsx";
import { useCallback, useEffect, useState, type AnimationEvent, type JSX, type ReactNode } from "react";
import { useI18n } from "../../i18n/index.js";
import { IconControlButton } from "../icons/index.js";
import styles from "./ShellDialpadPanel.module.css";

export type ShellDialpadPanelPresentation = "sidebar" | "fullPanel";

export type ShellDialpadPanelProps = Readonly<{
  open: boolean;
  title: string;
  testId: string;
  closeButtonTestId?: string;
  backButtonTestId?: string;
  presentation?: ShellDialpadPanelPresentation;
  showBack?: boolean;
  onClose: () => void;
  onBack?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}>;

type PanelPhase = "closed" | "open" | "closing";

const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion:" + " reduce)";

function prefersReducedMotion(): boolean {
  if (typeof window === typeof void 0 || window.matchMedia === undefined) {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches;
}

/**
 * - Purpose: left sidebar panel for contacts/history over shell body and avatar header.
 * - Inputs: open flag, title, optional back/footer slots, and close callback.
 * - Outputs: full-width slide-in region below window controls with enter/exit motion and Escape support.
 */
export function ShellDialpadPanel({
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
}: ShellDialpadPanelProps): JSX.Element | null {
  const { t } = useI18n();
  const [phase, setPhase] = useState<PanelPhase>(() => (open ? "open" : "closed"));
  const resolvedCloseTestId = closeButtonTestId ?? `${testId}-close`;
  const resolvedBackTestId = backButtonTestId ?? `${testId}-back`;

  const requestClose = useCallback((): void => {
    if (prefersReducedMotion()) {
      onClose();
      return;
    }
    setPhase("closing");
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setPhase("open");
      return;
    }

    setPhase((current) => {
      if (current !== "open") {
        return current;
      }
      return prefersReducedMotion() ? "closed" : "closing";
    });
  }, [open]);

  useEffect(() => {
    if (!open && phase !== "open") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      requestClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, phase, requestClose]);

  const handlePanelAnimationEnd = (event: AnimationEvent<HTMLElement>): void => {
    if (phase !== "closing" || event.target !== event.currentTarget) {
      return;
    }
    setPhase("closed");
    onClose();
  };

  if (phase === "closed") {
    return null;
  }

  const exiting = phase === "closing";

  return (
    <div
      className={styles.host}
      data-testid={testId}
      data-shell-overlay-interactive="true"
      data-shell-overlay-presentation={presentation}
      data-closing={exiting ? "true" : undefined}
      role="region"
      aria-label={title}
    >
      <section
        className={clsx(
          styles.panel,
          footer !== undefined ? styles.panelWithFooter : undefined,
          exiting ? styles.panelExiting : undefined,
        )}
        onAnimationEnd={handlePanelAnimationEnd}
      >
        <header className={styles.header}>
          <div className={styles.headerSlot}>
            {showBack && onBack !== undefined ? (
              <IconControlButton
                iconId="shell.nav.back"
                preferAnimated={false}
                ariaLabel={t("shell.overlay.back")}
                testId={resolvedBackTestId}
                className={styles.navButton}
                onClick={onBack}
              />
            ) : null}
          </div>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.headerSlot}>
            <IconControlButton
              iconId="overlay.close"
              preferAnimated={false}
              ariaLabel={t("shell.overlay.closeTitleAria", { title })}
              testId={resolvedCloseTestId}
              className={styles.navButton}
              onClick={requestClose}
            />
          </div>
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
