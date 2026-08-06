import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/AppIcon.js";
import { Button } from "../ui/button/index.js";
import styles from "./CallIdleEmptyState.module.css";

export type CallIdleEmptyStateProps = Readonly<{
  needsSignIn?: boolean;
  onSignIn?: () => void;
}>;

/**
 * - Purpose: idle call context placeholder when no sessions exist.
 * - Inputs: optional first-run sign-in CTA when SIP is not registered.
 * - Outputs: centered empty-state message and optional Account CTA.
 * @uiMeta lf=LF-020 f=F-003,F-016
 */
export function CallIdleEmptyState({
  needsSignIn = false,
  onSignIn,
}: CallIdleEmptyStateProps): JSX.Element {
  const { t } = useI18n();
  const showSignInCta = needsSignIn && onSignIn !== undefined;

  return (
    <div
      className={styles.root}
      data-testid="call-idle-empty-state"
      data-state={showSignInCta ? "needs-sign-in" : "ready"}
    >
      <div className={styles.iconWrap} aria-hidden>
        <AppIcon
          id={showSignInCta ? "settings.account" : "dial.call"}
          size={22}
          decorative
        />
      </div>
      <p className={styles.message}>
        {showSignInCta
          ? t("call.idle.needsSignIn.message")
          : t("call.idle.message")}
      </p>
      {showSignInCta ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={styles.signInCta}
          data-testid="call-idle-sign-in-cta"
          onClick={onSignIn}
        >
          {t("call.idle.needsSignIn.action")}
        </Button>
      ) : null}
    </div>
  );
}
