import type { JSX } from "react";
import type { OcpSignInStageVisualState } from "@application/projections/settings/deriveOcpSignInProgressView.js";
import { AppIcon, type IconSemanticId } from "../icons/AppIcon.js";
import { IconTooltip } from "../icons/IconTooltip.js";
import styles from "./OcpSignInProgress.module.css";

const STATUS_ICON_ID: Record<OcpSignInStageVisualState, IconSemanticId> = {
  completed: "account.authProgress.status.completed",
  active: "account.authProgress.status.active",
  pending: "account.authProgress.status.pending",
  failed: "account.authProgress.status.failed",
  timeout: "account.authProgress.status.timeout",
};

export type OcpSignInProgressStatusIconProps = Readonly<{
  state: OcpSignInStageVisualState;
  failureLabel: string | null;
  /** Localized status word (pending/active/…) for a11y when text is hidden. */
  statusLabel: string;
  /** Compact shell: icons only; failure still uses tooltip. */
  iconsOnly?: boolean;
}>;

/**
 * - Purpose: render per-stage status glyph (animated Lucide when available).
 * - Inputs: visual state, optional failure tooltip, a11y status label, compact mode.
 * - Outputs: decorative icon or help-button with failure tooltip.
 */
export function OcpSignInProgressStatusIcon({
  state,
  failureLabel,
  statusLabel,
  iconsOnly = false,
}: OcpSignInProgressStatusIconProps): JSX.Element {
  const iconSize = iconsOnly ? 12 : 14;
  const icon = (
    <AppIcon
      id={STATUS_ICON_ID[state]}
      size={iconSize}
      decorative
      /* Active: static SVG so CSS spin stays on geometric center. */
      preferAnimated={state !== "active"}
    />
  );

  if ((state === "failed" || state === "timeout") && failureLabel !== null) {
    return (
      <IconTooltip label={failureLabel}>
        <button
          type="button"
          className={styles.statusIcon}
          data-state={state}
          aria-label={failureLabel}
          data-testid="account-ocp-progress-failure-icon"
        >
          {icon}
        </button>
      </IconTooltip>
    );
  }

  return (
    <span
      className={styles.statusIcon}
      data-state={state}
      aria-label={iconsOnly ? statusLabel : undefined}
      aria-hidden={iconsOnly ? undefined : "true"}
      data-testid={state === "active" ? "account-ocp-progress-active-icon" : undefined}
    >
      {icon}
    </span>
  );
}
