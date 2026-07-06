import clsx from "clsx";
import {
  forwardRef,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from "react";
import { AppIcon, type IconSemanticId } from "../../icons/AppIcon.js";
import type { BadgeSize, BadgeTone } from "../types.js";
import styles from "./Badge.module.css";

export type BadgeProps = Readonly<
  Omit<HTMLAttributes<HTMLSpanElement>, "className"> & {
    tone?: BadgeTone;
    size?: BadgeSize;
    iconId?: IconSemanticId;
    className?: string;
    children?: ReactNode;
  }
>;

const TONE_CLASS: Record<BadgeTone, string> = {
  default: styles.toneDefault ?? "",
  muted: styles.toneMuted ?? "",
  success: styles.toneSuccess ?? "",
  warning: styles.toneWarning ?? "",
  destructive: styles.toneDestructive ?? "",
  info: styles.toneInfo ?? "",
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: styles.sizeSm ?? "",
  md: styles.sizeMd ?? "",
};

const ICON_SIZE: Record<BadgeSize, number> = {
  sm: 12,
  md: 14,
};

/**
 * - Purpose: compact status or category marker with tone, size, and optional icon.
 * - Inputs: tone, size, iconId, native span props, children.
 * - Outputs: inline badge element with semantic tone styling.
 */
export const Badge = forwardRef(function Badge(
  {
    tone = "default",
    size = "md",
    iconId,
    className,
    children,
    ...rest
  }: BadgeProps,
  ref: Ref<HTMLSpanElement>,
): JSX.Element {
  return (
    <span
      ref={ref}
      className={clsx(styles.badge, TONE_CLASS[tone], SIZE_CLASS[size], className)}
      {...rest}
      data-tone={tone}
      data-size={size}
    >
      {iconId ? (
        <span className={styles.icon} aria-hidden="true">
          <AppIcon id={iconId} size={ICON_SIZE[size]} decorative preferAnimated={false} />
        </span>
      ) : null}
      {children}
    </span>
  );
});
