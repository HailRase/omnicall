import clsx from "clsx";
import type { JSX } from "react";
import { deriveAvatarToneIndex } from "../../helpers/deriveAvatarToneIndex.js";
import { derivePersonInitials } from "../../helpers/derivePersonInitials.js";
import styles from "./PersonListAvatar.module.css";

export type PersonListAvatarProps = Readonly<{
  label: string;
  size?: "sm" | "md" | "lg";
  missed?: boolean;
}>;

const SIZE_CLASS = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
} as const;

const TONE_CLASS: Record<number, string> = {
  0: styles.tone0 ?? "",
  1: styles.tone1 ?? "",
  2: styles.tone2 ?? "",
  3: styles.tone3 ?? "",
  4: styles.tone4 ?? "",
  5: styles.tone5 ?? "",
};

/**
 * - Purpose: render circular initials avatar for contacts and history list rows.
 * - Inputs: display label seed, optional size, and missed-call badge flag.
 * - Outputs: non-interactive avatar with hash-based tone styling.
 */
export function PersonListAvatar({
  label,
  size = "md",
  missed = false,
}: PersonListAvatarProps): JSX.Element {
  const initials = derivePersonInitials(label);
  const toneIndex = deriveAvatarToneIndex(label);
  const toneClass = TONE_CLASS[toneIndex] ?? TONE_CLASS[0];

  return (
    <span
      className={clsx(styles.avatar, SIZE_CLASS[size], toneClass)}
      data-testid="person-list-avatar"
      aria-hidden="true"
    >
      <span className={styles.initials}>{initials}</span>
      {missed ? <span className={styles.missedBadge} data-testid="person-list-avatar-missed" /> : null}
    </span>
  );
}
