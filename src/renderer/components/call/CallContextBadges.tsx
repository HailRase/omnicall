import type { JSX } from "react";
import type { CallContextBadge } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import { Badge } from "../ui/badge/Badge.js";
import { Tooltip } from "../ui/tooltip/Tooltip.js";
import styles from "./CallContextBadges.module.css";

export type CallContextBadgesProps = Readonly<{
  badges: ReadonlyArray<CallContextBadge>;
  /** Compact density for incoming banner / session card. */
  density?: "default" | "compact";
}>;

/**
 * - Purpose: render OCP queue + campaign context badges on call surfaces (F-028).
 * - Inputs: derived badge list from Application; no gateway/store access.
 * - Outputs: accessible badge row; empty list renders nothing.
 * @uiMeta f=F-028 lf=LF-037,LF-038
 */
export function CallContextBadges({
  badges,
  density = "default",
}: CallContextBadgesProps): JSX.Element | null {
  const { t } = useI18n();
  if (badges.length === 0) {
    return null;
  }

  return (
    <div
      className={
        density === "compact" ? styles.rowCompact : styles.row
      }
      data-testid="call-context-badges"
      data-density={density}
    >
      {badges.map((badge) => {
        if (badge.kind === "queuePending") {
          return (
            <span
              key="queuePending"
              className={styles.pending}
              data-testid="queue-info-label"
              data-state="pending"
              aria-label={t("call.context.queuePendingAria")}
            />
          );
        }
        if (badge.kind === "queue") {
          const queueName = badge.value ?? "";
          return (
            <Tooltip key={`queue:${queueName}`} label={queueName}>
              <Badge
                tone="muted"
                size="sm"
                iconId="call.queue"
                className={styles.queueBadge}
                title={t("call.context.queue")}
                data-testid="queue-info-label"
              >
                <span className={styles.queueLabel}>{queueName}</span>
              </Badge>
            </Tooltip>
          );
        }
        if (badge.kind === "progressive") {
          return (
            <Badge
              key="progressive"
              tone="warning"
              size="sm"
              title={t("call.context.progressive")}
              data-testid="incoming-campaign-context"
              data-campaign-badge="progressive"
            >
              {t("call.context.progressive")}
            </Badge>
          );
        }
        if (badge.kind === "company") {
          return (
            <Badge
              key={`company:${badge.value ?? ""}`}
              tone="muted"
              size="sm"
              title={t("call.context.company")}
              data-testid="incoming-campaign-context"
              data-campaign-badge="company"
            >
              {badge.value}
            </Badge>
          );
        }
        return (
          <Badge
            key={`selection:${badge.value ?? ""}`}
            tone="muted"
            size="sm"
            title={t("call.context.selection")}
            data-testid="incoming-campaign-context"
            data-campaign-badge="selection"
          >
            {badge.value}
          </Badge>
        );
      })}
    </div>
  );
}
