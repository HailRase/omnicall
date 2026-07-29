import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import { Alert, AlertDescription, AlertTitle } from "../../ui/index.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesRunResultValue = Readonly<{
  kind: "success" | "error";
  status: number | null;
  durationMs: number;
  body: string;
  bodyTruncated: boolean;
  category?: "http" | "network" | "timeout" | "aborted" | "validation";
  code?: string;
  jsonValidity: "valid" | "invalid" | "not_applicable";
}>;

export type ExternalServicesRunResultProps = Readonly<{
  result: ExternalServicesRunResultValue | null;
  runState: "idle" | "queued" | "running";
}>;

const categoryKeys: Readonly<
  Record<NonNullable<ExternalServicesRunResultValue["category"]>, TranslationKey>
> = {
  http: "settings.integrations.externalServices.run.category.http",
  network: "settings.integrations.externalServices.run.category.network",
  timeout: "settings.integrations.externalServices.run.category.timeout",
  aborted: "settings.integrations.externalServices.run.category.aborted",
  validation: "settings.integrations.externalServices.run.category.validation",
};

/** - Purpose: display the classified result of a manual request run.
 * - Inputs: safe execution result projection.
 * - Outputs: accessible status or error feedback without classifying HTTP.
 * @uiMeta f=F-031
 */
export function ExternalServicesRunResult({
  result,
  runState,
}: ExternalServicesRunResultProps): JSX.Element | null {
  const { t } = useI18n();
  if (runState !== "idle") {
    return (
      <Alert data-testid="external-services-run-progress">
        <AlertTitle>
          {t(
            runState === "queued"
              ? "settings.integrations.externalServices.run.queued"
              : "settings.integrations.externalServices.run.running",
          )}
        </AlertTitle>
      </Alert>
    );
  }
  if (result === null) return null;
  const isError = result.kind === "error";
  return <Alert variant={isError ? "destructive" : "default"} data-testid="external-services-run-result">
    <AlertTitle>{t(isError ? "settings.integrations.externalServices.run.error" : "settings.integrations.externalServices.run.success")}</AlertTitle>
    <AlertDescription>
      <dl className={styles.runMetadata}>
        <div><dt>{t("settings.integrations.externalServices.run.status")}</dt><dd>{result.status ?? t("settings.integrations.externalServices.run.noStatus")}</dd></div>
        <div><dt>{t("settings.integrations.externalServices.run.duration")}</dt><dd>{t("settings.integrations.externalServices.run.durationValue", { duration: result.durationMs })}</dd></div>
      </dl>
      {result.category !== undefined ? <p>{t(categoryKeys[result.category])}</p> : null}
      {result.code !== undefined ? <p>{result.code}</p> : null}
      {result.body.length > 0 ? <pre className={styles.resultBody}>{result.body}</pre> : null}
      {result.bodyTruncated ? <p>{t("settings.integrations.externalServices.run.truncated")}</p> : null}
      {result.jsonValidity === "invalid" ? <p>{t("settings.integrations.externalServices.run.invalidJson")}</p> : null}
    </AlertDescription>
  </Alert>;
}
