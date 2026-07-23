/**
 * Subtle MM:SS deadline clock for SDK operator modal headers (light/dark via tokens).
 */

import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { formatMmSsCountdown } from "@shared/integration/formatMmSsCountdown.js";
import { useI18n } from "../../i18n/index.js";
import { useDeadlineCountdown } from "../../hooks/useDeadlineCountdown.js";
import styles from "./SdkModalDeadlineTimer.module.css";

export type SdkModalDeadlineTimerProps = Readonly<{
  expiresAt: string | null | undefined;
  active?: boolean;
  /** Fires once when remaining seconds reach zero (idempotent per expiresAt). */
  onExpired?: () => void;
  testId?: string;
}>;

/** Compact muted countdown for AlertDialog headers. */
export function SdkModalDeadlineTimer(
  props: SdkModalDeadlineTimerProps,
): JSX.Element | null {
  const { t } = useI18n();
  const active = props.active !== false;
  const seconds = useDeadlineCountdown(props.expiresAt, active);
  const onExpiredRef = useRef(props.onExpired);
  const firedForExpiresAtRef = useRef<string | null>(null);

  useEffect(() => {
    onExpiredRef.current = props.onExpired;
  }, [props.onExpired]);

  useEffect(() => {
    firedForExpiresAtRef.current = null;
  }, [props.expiresAt]);

  useEffect(() => {
    if (
      seconds !== 0 ||
      props.expiresAt === undefined ||
      props.expiresAt === null ||
      onExpiredRef.current === undefined
    ) {
      return;
    }
    if (firedForExpiresAtRef.current === props.expiresAt) {
      return;
    }
    firedForExpiresAtRef.current = props.expiresAt;
    onExpiredRef.current();
  }, [seconds, props.expiresAt]);

  if (seconds === null || props.expiresAt === undefined || props.expiresAt === null) {
    return null;
  }

  const label = formatMmSsCountdown(seconds);
  return (
    <time
      className={styles.timer}
      dateTime={`PT${String(seconds)}S`}
      aria-label={t("settings.integrations.sdk.modal.deadlineAria", {
        time: label,
      })}
      data-testid={props.testId ?? "sdk-modal-deadline-timer"}
    >
      {label}
    </time>
  );
}
