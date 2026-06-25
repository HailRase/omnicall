import clsx from "clsx";
import type { JSX } from "react";
import styles from "./UserAvatar.module.css";

export type UserAvatarProps = Readonly<{
  initials: string;
  ariaLabel?: string;
  onClick?: () => void;
}>;

/**
 * - Purpose: present account avatar placeholder with initials (menu deferred).
 * - Inputs: initials string and optional click handler / aria label.
 * - Outputs: accessible avatar surface for header chrome.
 * @uiMeta lf=LF-086 f=F-016 smoke=R7-*
 */
export function UserAvatar({
  initials,
  ariaLabel = "Аватар пользователя",
  onClick,
}: UserAvatarProps): JSX.Element {
  const className = clsx(
    styles["avatar"],
    onClick !== undefined && styles["interactive"],
  );
  const content = (
    <span className={styles["initials"]} aria-hidden="true">
      {initials}
    </span>
  );

  if (onClick !== undefined) {
    return (
      <button
        type="button"
        className={className}
        data-testid="user-avatar"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={className} data-testid="user-avatar" aria-label={ariaLabel}>
      {content}
    </span>
  );
}
