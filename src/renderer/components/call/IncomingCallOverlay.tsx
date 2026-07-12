import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useRef, type JSX, type KeyboardEvent, type MouseEvent } from "react";

import type { IncomingCallUiState } from "@application/index.js";

import { formatAutoAnswerCountdownLabel } from "../../helpers/formatAutoAnswerCountdownLabel.js";

import { useI18n } from "../../i18n/index.js";

import { AppIcon } from "../icons/index.js";

import { IncomingCallStatusMessage } from "./IncomingCallStatusMessage.js";
import { TruncatedTextLine } from "./TruncatedTextLine.js";

import styles from "./IncomingCallOverlay.module.css";

export type IncomingCallOverlayProps = Readonly<{
  visible: boolean;
  callerNumber: string | null;
  displayName: string | null;
  autoAnswerSecondsRemaining: number | null;
  uiState: IncomingCallUiState;
  answerDisabledReason: string | null;
  videoAnswerDisabledReason?: string | null;
  rejectDisabledReason: string | null;
  onOpenCallSurface: () => void;
  onAnswer: () => void;
  onAnswerWithVideo?: (() => void) | undefined;
  onReject: () => void;
  onDismiss: () => void;
}>;

const BANNER_MOTION = {
  initial: { opacity: 0, y: -18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
} as const;

const BANNER_ENTER_TRANSITION = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
} as const;

const BANNER_EXIT_TRANSITION = {
  duration: 0.16,
  ease: [0.4, 0, 1, 1],
} as const;

const BUTTON_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 25,
} as const;

const ICON_PULSE_TRANSITION = {
  duration: 1.6,
  repeat: Infinity,
  ease: "easeInOut",
} as const;

function resolvePrimaryLabel(
  t: ReturnType<typeof useI18n>["t"],
  displayName: string | null,
  callerNumber: string | null,
): string {
  if (displayName !== null && displayName.trim().length > 0) {
    return displayName;
  }
  return callerNumber ?? t("incoming.unknownCaller");
}

function shouldShowStatusMessage(uiState: IncomingCallUiState): boolean {
  return (
    uiState === "answerFailed" ||
    uiState === "rejectFailed" ||
    uiState === "incomingEndedBeforeAnswer" ||
    uiState === "dndAutoRejecting"
  );
}

function stopActionPropagation(event: MouseEvent<HTMLButtonElement>): void {
  event.stopPropagation();
}

/**
 * - Purpose: non-blocking iOS compact incoming call banner with accept/reject actions (F-002).
 * - Inputs: caller identity, disabled reasons, and overlay action callbacks.
 * - Outputs: top-center frosted-glass overlay UI; intents emitted via props only.
 * @uiMeta lf=LF-013,LF-014 f=F-002 smoke=R3-2
 */
export function IncomingCallOverlay({
  visible,
  callerNumber,
  displayName,
  autoAnswerSecondsRemaining,
  uiState,
  answerDisabledReason,
  videoAnswerDisabledReason = null,
  rejectDisabledReason,
  onOpenCallSurface,
  onAnswer,
  onAnswerWithVideo,
  onReject,
  onDismiss,
}: IncomingCallOverlayProps): JSX.Element {
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const overlayRef = useRef<HTMLElement | null>(null);
  const autoAnswerTotalRef = useRef<number | null>(null);

  useEffect(() => {
    if (visible) {
      overlayRef.current?.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (autoAnswerSecondsRemaining === null) {
      autoAnswerTotalRef.current = null;
      return;
    }
    if (autoAnswerTotalRef.current === null) {
      autoAnswerTotalRef.current = autoAnswerSecondsRemaining;
    }
  }, [autoAnswerSecondsRemaining]);

  const hasName =
    displayName !== null && displayName.trim().length > 0 && callerNumber !== null;
  const autoAnswerActive = autoAnswerSecondsRemaining !== null;
  const autoAnswerTotal = autoAnswerTotalRef.current ?? autoAnswerSecondsRemaining ?? 1;
  const primaryLabel = resolvePrimaryLabel(t, displayName, callerNumber);

  const bannerEnterTransition = prefersReducedMotion ? { duration: 0 } : BANNER_ENTER_TRANSITION;
  const bannerExitTransition = prefersReducedMotion ? { duration: 0 } : BANNER_EXIT_TRANSITION;
  const buttonTransition = prefersReducedMotion ? { duration: 0 } : BUTTON_SPRING;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Enter" && answerDisabledReason === null) {
      event.preventDefault();
      onAnswer();
      return;
    }
    if (event.key === "Escape" && rejectDisabledReason === null) {
      event.preventDefault();
      onReject();
    }
  };

  const handleBodyKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      onOpenCallSurface();
    }
  };

  return (
    <div className={styles.anchor} data-testid="incoming-call-overlay-anchor">
      <AnimatePresence>
        {visible ? (
          <motion.section
            key="incoming-call-overlay"
            ref={overlayRef}
            role="dialog"
            aria-label={t("incoming.ariaLabel")}
            tabIndex={-1}
            className={styles.overlay}
            data-testid="incoming-call-overlay"
            initial={prefersReducedMotion ? false : BANNER_MOTION.initial}
            animate={BANNER_MOTION.animate}
            {...(prefersReducedMotion
              ? {}
              : {
                  exit: { ...BANNER_MOTION.exit, transition: bannerExitTransition },
                })}
            transition={bannerEnterTransition}
            onKeyDown={handleKeyDown}
          >
            {autoAnswerActive ? (
              <div className={styles.autoAnswerTrack} aria-hidden="true">
                <motion.div
                  key={autoAnswerTotal}
                  className={styles.autoAnswerFill}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: autoAnswerTotal, ease: "linear" }
                  }
                />
              </div>
            ) : null}

            <button
              type="button"
              className={styles.dismissButton}
              data-testid="incoming-call-overlay-dismiss"
              aria-label={t("incoming.dismissAria")}
              onClick={(event) => {
                stopActionPropagation(event);
                onDismiss();
              }}
            >
              <AppIcon id="overlay.close" size={12} decorative />
            </button>

            <div className={styles.body}>
              <div className={styles.mainRow}>
                <button
                  type="button"
                  className={styles.rowSurface}
                  data-testid="incoming-call-overlay-body"
                  aria-label={t("incoming.openCallSurfaceAria")}
                  onClick={onOpenCallSurface}
                  onKeyDown={handleBodyKeyDown}
                />
                <div className={styles.mainRowForeground}>
                  {prefersReducedMotion ? (
                    <div className={styles.iconCircle}>
                      <AppIcon id="call.incoming" size={18} preferAnimated={false} decorative />
                    </div>
                  ) : (
                    <motion.div
                      className={styles.iconCircle}
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={ICON_PULSE_TRANSITION}
                    >
                      <AppIcon id="call.incoming" size={18} preferAnimated={false} decorative />
                    </motion.div>
                  )}
                  <div className={styles.identity} data-testid="caller-identity">
                    <TruncatedTextLine text={primaryLabel} className={styles.primaryName} />
                    {hasName && callerNumber !== null ? (
                      <TruncatedTextLine text={callerNumber} className={styles.secondaryNumber} />
                    ) : null}
                    {autoAnswerActive && autoAnswerSecondsRemaining !== null ? (
                      <p
                        className={styles.autoAnswerHint}
                        data-testid="auto-answer-countdown"
                        aria-live="polite"
                      >
                        {formatAutoAnswerCountdownLabel(autoAnswerSecondsRemaining)}
                      </p>
                    ) : null}
                  </div>

                  <div className={styles.actionButtons}>
                    <motion.button
                      type="button"
                      className={clsx(styles.actionButton, styles.answerButton)}
                      data-testid="answer-call"
                      aria-label={t("incoming.answerAria")}
                      disabled={answerDisabledReason !== null}
                      {...(prefersReducedMotion
                        ? {}
                        : { whileHover: { scale: 1.05 }, whileTap: { scale: 0.94 } })}
                      transition={buttonTransition}
                      onClick={(event) => {
                        stopActionPropagation(event);
                        onAnswer();
                      }}
                    >
                      <AppIcon id="call.answer" size={16} decorative />
                    </motion.button>
                    {onAnswerWithVideo !== undefined ? (
                      <motion.button
                        type="button"
                        className={clsx(styles.actionButton, styles.answerVideoButton)}
                        data-testid="answer-call-video"
                        aria-label={t("incoming.answerVideoAria")}
                        disabled={videoAnswerDisabledReason !== null}
                        {...(prefersReducedMotion
                          ? {}
                          : { whileHover: { scale: 1.05 }, whileTap: { scale: 0.94 } })}
                        transition={buttonTransition}
                        onClick={(event) => {
                          stopActionPropagation(event);
                          onAnswerWithVideo();
                        }}
                      >
                        <AppIcon id="dial.videoCall" size={16} decorative />
                      </motion.button>
                    ) : null}
                    <motion.button
                      type="button"
                      className={clsx(styles.actionButton, styles.rejectButton)}
                      data-testid="reject-call"
                      aria-label={t("incoming.rejectAria")}
                      disabled={rejectDisabledReason !== null}
                      {...(prefersReducedMotion
                        ? {}
                        : { whileHover: { scale: 1.05 }, whileTap: { scale: 0.94 } })}
                      transition={buttonTransition}
                      onClick={(event) => {
                        stopActionPropagation(event);
                        onReject();
                      }}
                    >
                      <AppIcon id="call.reject" size={16} decorative />
                    </motion.button>
                  </div>
                </div>
              </div>

              {shouldShowStatusMessage(uiState) ? (
                <div className={styles.statusBlock}>
                  <IncomingCallStatusMessage uiState={uiState} />
                </div>
              ) : null}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
