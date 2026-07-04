import clsx from "clsx";
import { forwardRef, type JSX, type Ref } from "react";
import { useI18n } from "../../i18n/index.js";
import styles from "./UserAvatar.module.css";

export type UserAvatarProps = Readonly<{
  initials: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: "menu";
  onClick?: () => void;
}>;

/**
 * - Purpose: present account avatar with initials and optional user menu trigger.
 * - Inputs: initials, aria attributes, optional click handler.
 * - Outputs: accessible avatar surface for header chrome.
 * @uiMeta lf=LF-086 f=F-016 smoke=R7-*
 */
export const UserAvatar = forwardRef(function UserAvatar(
  {
    initials,
    ariaLabel,
    ariaExpanded,
    ariaHasPopup,
    onClick,
  }: UserAvatarProps,
  ref: Ref<HTMLButtonElement>,
): JSX.Element {
  const { t } = useI18n();
  const resolvedAriaLabel = ariaLabel ?? t("header.avatar.ariaLabel");
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
        ref={ref}
        type="button"
        className={className}
        data-testid="user-avatar"
        aria-label={resolvedAriaLabel}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={className} data-testid="user-avatar" aria-label={resolvedAriaLabel}>
      {content}
    </span>
  );
});

UserAvatar.displayName = "UserAvatar";
