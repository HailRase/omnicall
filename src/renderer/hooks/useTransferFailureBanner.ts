import { useCallback, useEffect, useRef, useState } from "react";

export const TRANSFER_FAILURE_BANNER_TTL_MS = 5000;

type UseTransferFailureBannerInput = Readonly<{
  failureMessage: string | null;
  failureKey: string | null;
  transferInProgress: boolean;
}>;

type UseTransferFailureBannerResult = Readonly<{
  failureBannerMessage: string | null;
  dismissFailureBanner: () => void;
}>;

/**
 * - Purpose: show transfer failure copy with auto-dismiss and manual retry reset.
 * - Inputs: resolved failure message, stable failure key, transfer-in-progress flag.
 * - Outputs: ephemeral banner text and dismiss callback for new transfer attempts.
 */
export function useTransferFailureBanner(
  input: UseTransferFailureBannerInput,
): UseTransferFailureBannerResult {
  const { failureMessage, failureKey, transferInProgress } = input;
  const [visibleMessage, setVisibleMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedFailureKeyRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismissFailureBanner = useCallback(() => {
    if (failureKey !== null) {
      dismissedFailureKeyRef.current = failureKey;
    }
    setVisibleMessage(null);
    clearTimer();
  }, [failureKey, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (transferInProgress) {
      dismissFailureBanner();
    }
  }, [transferInProgress, dismissFailureBanner]);

  useEffect(() => {
    if (failureMessage === null || failureKey === null) {
      dismissedFailureKeyRef.current = null;
      setVisibleMessage(null);
      clearTimer();
      return;
    }

    if (failureKey === dismissedFailureKeyRef.current) {
      return;
    }

    setVisibleMessage(failureMessage);
    clearTimer();
    timerRef.current = setTimeout(() => {
      dismissedFailureKeyRef.current = failureKey;
      setVisibleMessage(null);
      timerRef.current = null;
    }, TRANSFER_FAILURE_BANNER_TTL_MS);
  }, [failureMessage, failureKey, clearTimer]);

  return { failureBannerMessage: visibleMessage, dismissFailureBanner };
}
