import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import { AppIcon } from "../../icons/AppIcon.js";
import { IconTooltip } from "../../icons/IconTooltip.js";
import { Button, Input, Select } from "../../ui/index.js";
import styles from "./ExternalServices.module.css";

export type ExternalServicesRequestUrlBarProps = Readonly<{
  method: string;
  url: string;
  busy: boolean;
  runState: "idle" | "queued" | "running";
  onMethodChange: (method: string) => void;
  onUrlChange: (url: string) => void;
  onUrlFocus: () => void;
  onRunNow: () => void;
}>;

/**
 * - Purpose: method/URL/Send bar for External Services requests.
 * - Inputs: draft method/url, busy/run state, change and run intents.
 * - Outputs: presentational URL-bar intents only.
 * @uiMeta f=F-031
 */
export function ExternalServicesRequestUrlBar({
  method,
  url,
  busy,
  runState,
  onMethodChange,
  onUrlChange,
  onUrlFocus,
  onRunNow,
}: ExternalServicesRequestUrlBarProps): JSX.Element {
  const { t } = useI18n();
  const canSend = url.trim().length > 0;
  const sendDisabledReason = canSend
    ? null
    : t("settings.integrations.externalServices.disabled.urlRequired");

  return (
    <div className={styles.urlBarBlock}>
      <div className={styles.urlBar}>
        <Select
          value={method}
          disabled={busy}
          data-testid="external-services-request-method"
          items={["GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => ({
            value,
            label: value,
          }))}
          onValueChange={onMethodChange}
        />
        <Input
          value={url}
          disabled={busy}
          data-testid="external-services-request-url"
          placeholder={t("settings.integrations.externalServices.editor.urlPlaceholder")}
          onFocus={onUrlFocus}
          onChange={(event) => onUrlChange(event.currentTarget.value)}
        />
        <IconTooltip
          label={sendDisabledReason ?? t("settings.integrations.externalServices.run.send")}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={runState !== "idle"}
            disabled={!canSend}
            aria-label={t("settings.integrations.externalServices.run.send")}
            className={styles.sendButton}
            data-testid="external-services-run-now"
            onClick={onRunNow}
          >
            {runState === "idle" ? (
              <AppIcon
                id="settings.integrations.external-services.send"
                size={14}
                decorative
                preferAnimated={false}
              />
            ) : null}
          </Button>
        </IconTooltip>
      </div>
    </div>
  );
}
