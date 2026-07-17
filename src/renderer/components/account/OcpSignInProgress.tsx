import type { JSX } from "react";
import {
  OCP_SIGN_IN_EXECUTION_STAGES,
  type OcpSignInExecutionStage,
  type AuthorizationProgressProjection,
} from "@application/projections/settings/authorizationProgressProjection.js";
import { useI18n } from "../../i18n/index.js";
import type { TranslationKey } from "../../i18n/messages.js";
import { Button } from "../ui/index.js";
import styles from "./OcpSignInProgress.module.css";

const STAGE_KEY: Record<OcpSignInExecutionStage, TranslationKey> = {
  requesting_authorization_token: "account.authProgress.stage.httpToken",
  submitting_token_to_ocp: "account.authProgress.stage.submitToken",
  awaiting_authorization_data: "account.authProgress.stage.awaitData",
  connecting_sip_transport: "account.authProgress.stage.sipTransport",
  authorizing_sip: "account.authProgress.stage.sipAuthorization",
};

type OcpSignInProgressProps = Readonly<{
  progress: AuthorizationProgressProjection;
  onRestart: () => void;
}>;

export function OcpSignInProgress({
  progress,
  onRestart,
}: OcpSignInProgressProps): JSX.Element | null {
  const { t } = useI18n();
  const isVisible =
    progress.executionStage !== null ||
    progress.completedExecutionStages.length > 0 ||
    progress.failedExecutionStage !== null;
  if (!isVisible) {
    return null;
  }

  return (
    <section
      className={styles.root}
      aria-label={t("account.authProgress.stagesAria")}
      aria-live="polite"
      data-testid="account-ocp-progress"
    >
      <ol className={styles.list}>
        {OCP_SIGN_IN_EXECUTION_STAGES.map((stage, index) => {
          const failed = progress.failedExecutionStage === stage;
          const completed = progress.completedExecutionStages.includes(stage);
          const active = progress.executionStage === stage && !failed;
          const status = failed
            ? t(
                progress.failureReason === "timeout"
                  ? "account.authProgress.status.timeout"
                  : "account.authProgress.status.failed",
              )
            : completed
              ? t("account.authProgress.status.completed")
              : active
                ? t("account.authProgress.status.active")
                : t("account.authProgress.status.pending");
          return (
            <li
              key={stage}
              className={styles.item}
              data-state={
                failed ? "failed" : completed ? "completed" : active ? "active" : "pending"
              }
            >
              <span className={styles.index} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.label}>{t(STAGE_KEY[stage])}</span>
              <span className={styles.status}>{status}</span>
            </li>
          );
        })}
      </ol>
      {progress.failedExecutionStage !== null ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="account-ocp-progress-restart"
          onClick={onRestart}
        >
          {t("account.authProgress.restart")}
        </Button>
      ) : null}
    </section>
  );
}
