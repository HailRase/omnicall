import { useCallback, useEffect, useRef, useState } from "react";
import {
  isTransferSuccessCelebrationEvent,
  TRANSFER_SUCCESS_CELEBRATION_TTL_MS,
} from "@application/index.js";
import type { DomainEventPublisher } from "@ports/index.js";

const EXIT_ANIMATION_MS = 280;

type UseTransferSuccessCelebrationInput = Readonly<{
  eventPublisher: DomainEventPublisher;
  incomingCallVisible: boolean;
}>;

type UseTransferSuccessCelebrationResult = Readonly<{
  visible: boolean;
  exiting: boolean;
  dismissCelebration: () => void;
}>;

/**
 * - Purpose: ephemeral transfer success celebration driven by domain success events.
 * - Inputs: domain event publisher and incoming-call visibility for early dismiss.
 * - Outputs: celebration visibility, exit phase, and manual dismiss callback.
 */
export function useTransferSuccessCelebration(
  input: UseTransferSuccessCelebrationInput,
): UseTransferSuccessCelebrationResult {
  const { eventPublisher, incomingCallVisible } = input;
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const visibleRef = useRef(false);
  const exitingRef = useRef(false);
  const ttlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  visibleRef.current = visible;
  exitingRef.current = exiting;

  const clearTtlTimer = useCallback(() => {
    if (ttlTimerRef.current !== null) {
      clearTimeout(ttlTimerRef.current);
      ttlTimerRef.current = null;
    }
  }, []);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const finishCelebration = useCallback(() => {
    clearTtlTimer();
    clearExitTimer();
    setExiting(false);
    setVisible(false);
  }, [clearExitTimer, clearTtlTimer]);

  const dismissCelebration = useCallback(() => {
    if (!visibleRef.current || exitingRef.current) {
      return;
    }
    clearTtlTimer();
    setExiting(true);
    clearExitTimer();
    exitTimerRef.current = setTimeout(() => {
      finishCelebration();
      exitTimerRef.current = null;
    }, EXIT_ANIMATION_MS);
  }, [clearExitTimer, clearTtlTimer, finishCelebration]);

  const startCelebration = useCallback(() => {
    clearTtlTimer();
    clearExitTimer();
    setExiting(false);
    setVisible(true);
    ttlTimerRef.current = setTimeout(() => {
      dismissCelebration();
      ttlTimerRef.current = null;
    }, TRANSFER_SUCCESS_CELEBRATION_TTL_MS);
  }, [clearExitTimer, clearTtlTimer, dismissCelebration]);

  useEffect(
    () => () => {
      clearTtlTimer();
      clearExitTimer();
    },
    [clearExitTimer, clearTtlTimer],
  );

  useEffect(() => {
    return eventPublisher.subscribe((event) => {
      if (isTransferSuccessCelebrationEvent(event)) {
        startCelebration();
      }
    });
  }, [eventPublisher, startCelebration]);

  useEffect(() => {
    if (incomingCallVisible && visible) {
      dismissCelebration();
    }
  }, [dismissCelebration, incomingCallVisible, visible]);

  return {
    visible,
    exiting,
    dismissCelebration,
  };
}
