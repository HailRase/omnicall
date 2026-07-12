import { motion, useReducedMotion, type Transition } from "framer-motion";
import type { JSX } from "react";
import { ListQuickCallButton, type ListQuickCallButtonProps } from "./ListQuickCallButton.js";
import styles from "./ListQuickCallReveal.module.css";

const BUTTON_SIZE_PX = 32;

const HOST_MOTION = {
  hidden: { width: 0 },
  visible: { width: BUTTON_SIZE_PX },
} as const;

const BUTTON_MOTION = {
  hidden: { opacity: 0, x: 12, scale: 0.72 },
  visible: { opacity: 1, x: 0, scale: 1 },
} as const;

const HOST_ENTER_TRANSITION = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
} as const;

const HOST_EXIT_TRANSITION = {
  duration: 0.26,
  ease: [0.4, 0, 0.75, 0.15],
} as const;

const BUTTON_ENTER_TRANSITION = {
  type: "spring",
  stiffness: 360,
  damping: 28,
  mass: 0.85,
} as const;

const BUTTON_EXIT_TRANSITION = {
  duration: 0.24,
  ease: [0.4, 0, 0.85, 0.2],
} as const;

const INSTANT_TRANSITION = { duration: 0 } as const;

export type ListQuickCallRevealProps = ListQuickCallButtonProps &
  Readonly<{
    visible: boolean;
  }>;

/**
 * - Purpose: animate quick-call affordance in list rows on hover or focus reveal.
 * - Inputs: visibility flag plus ListQuickCallButton labels and callbacks.
 * - Outputs: slide-and-scale reveal from the right without clipping the circular button.
 */
export function ListQuickCallReveal({
  visible,
  ...buttonProps
}: ListQuickCallRevealProps): JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const hostTransition: Transition = prefersReducedMotion
    ? INSTANT_TRANSITION
    : visible
      ? HOST_ENTER_TRANSITION
      : HOST_EXIT_TRANSITION;

  const buttonTransition: Transition = prefersReducedMotion
    ? INSTANT_TRANSITION
    : visible
      ? BUTTON_ENTER_TRANSITION
      : BUTTON_EXIT_TRANSITION;

  return (
    <motion.div
      className={styles.host}
      initial={false}
      animate={visible ? "visible" : "hidden"}
      variants={HOST_MOTION}
      transition={hostTransition}
      aria-hidden={!visible}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <motion.div
        className={styles.buttonSlot}
        initial={false}
        animate={visible ? "visible" : "hidden"}
        variants={BUTTON_MOTION}
        transition={buttonTransition}
        style={{ transformOrigin: "100% 50%", width: BUTTON_SIZE_PX }}
      >
        <ListQuickCallButton {...buttonProps} />
      </motion.div>
    </motion.div>
  );
}
