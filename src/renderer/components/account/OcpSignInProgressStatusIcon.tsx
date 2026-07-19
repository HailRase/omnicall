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
};

export type OcpSignInProgressStatusIconProps = Readonly<{
  state: OcpSignInStageVisualState;
  failureLabel: string | null;
}>;

/**
 * - Purpose: render per-stage status glyph (animated Lucide when available).
 * - Inputs: visual state and optional failure tooltip label.
 * - Outputs: decorative icon or help-button with failure tooltip.
 */
export function OcpSignInProgressStatusIcon({
  state,
  failureLabel,
}: OcpSignInProgressStatusIconProps): JSX.Element {
  const icon = (
    <AppIcon
      id={STATUS_ICON_ID[state]}
      size={14}
      decorative
      /* Active: static SVG so CSS spin stays on geometric center. */
      preferAnimated={state !== "active"}
    />
  );

  if (state === "failed" && failureLabel !== null) {
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
      aria-hidden="true"
      data-testid={state === "active" ? "account-ocp-progress-active-icon" : undefined}
    >
      {icon}
    </span>
  );
}
