import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/AppIcon.js";
import styles from "./CallIdleEmptyState.module.css";

/**
 * - Purpose: idle call context placeholder when no sessions exist.
 * - Inputs: none.
 * - Outputs: centered empty-state message for the context zone.
 * @uiMeta lf=LF-020 f=F-003,F-016
 */
export function CallIdleEmptyState(): JSX.Element {
  const { t } = useI18n();
  return (
    <div className={styles["root"]} data-testid="call-idle-empty-state">
      <div className={styles["iconWrap"]} aria-hidden>
        <AppIcon id="dial.call" size={22} decorative />
      </div>
      <p className={styles["message"]}>
        {t("call.idle.message")}
      </p>
    </div>
  );
}
