import clsx from "clsx";
import type { JSX } from "react";
import styles from "./AppIcon.module.css";
import {
  resolveIconDefaultLabel,
  resolveIconEntry,
  type IconSemanticId,
} from "./iconCatalog.js";

export type AppIconProps = Readonly<{
  id: IconSemanticId;
  size?: number;
  className?: string;
  preferAnimated?: boolean;
  decorative?: boolean;
  label?: string;
}>;

/**
 * - Purpose: render semantic UI icons from catalog with animated fallback.
 * - Inputs: semantic icon id, size, animation preference, a11y flags.
 * - Outputs: lucide-animated or lucide-react icon element.
 */
export function AppIcon({
  id,
  size,
  className,
  preferAnimated = true,
  decorative = true,
  label,
}: AppIconProps): JSX.Element {
  const entry = resolveIconEntry(id);
  const resolvedSize = size ?? entry.defaultSize;
  const mergedClassName = clsx(styles["icon"], className);
  const accessibilityProps = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ "aria-label": label ?? resolveIconDefaultLabel(id), role: "img" } as const);

  if (preferAnimated && entry.animated !== undefined) {
    const AnimatedIcon = entry.animated;
    return (
      <AnimatedIcon
        size={resolvedSize}
        className={mergedClassName}
        animateOnHover
        {...accessibilityProps}
      />
    );
  }

  const StaticIcon = entry.static;
  return (
    <StaticIcon size={resolvedSize} className={mergedClassName} {...accessibilityProps} />
  );
}

export type { IconSemanticId } from "./iconCatalog.js";
