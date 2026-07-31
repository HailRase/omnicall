import type { JSX } from "react";
import { useI18n } from "../../../i18n/index.js";
import type { TranslationKey } from "../../../i18n/messages.js";
import styles from "./ExternalServices.module.css";

const BODY_MODES = ["none", "json", "x-www-form-urlencoded", "raw"] as const;

export type ExternalServicesBodyMode = (typeof BODY_MODES)[number];

const bodyModeKeys: Readonly<Record<ExternalServicesBodyMode, TranslationKey>> = {
  none: "settings.integrations.externalServices.bodyMode.none",
  json: "settings.integrations.externalServices.bodyMode.json",
  "x-www-form-urlencoded": "settings.integrations.externalServices.bodyMode.x-www-form-urlencoded",
  raw: "settings.integrations.externalServices.bodyMode.raw",
};

export type ExternalServicesBodyModeRadiosProps = Readonly<{
  value: string;
  disabled: boolean;
  onChange: (mode: string) => void;
}>;

/**
 * - Purpose: horizontal body-format radio group for External Services request editor.
 * - Inputs: current mode, disabled flag, change callback.
 * - Outputs: accessible radio selection intents without HTTP logic.
 * @uiMeta f=F-031
 */
export function ExternalServicesBodyModeRadios({
  value,
  disabled,
  onChange,
}: ExternalServicesBodyModeRadiosProps): JSX.Element {
  const { t } = useI18n();
  const selected = BODY_MODES.includes(value as ExternalServicesBodyMode)
    ? value
    : "none";

  return (
    <fieldset
      className={styles.bodyModeRadios}
      disabled={disabled}
      data-testid="external-services-body-mode"
    >
      <legend className={styles.bodyModeLegend}>
        {t("settings.integrations.externalServices.editor.bodyMode")}
      </legend>
      <div className={styles.bodyModeRow} role="radiogroup" aria-label={t("settings.integrations.externalServices.editor.bodyMode")}>
        {BODY_MODES.map((mode) => {
          const id = `external-services-body-mode-${mode}`;
          return (
            <label key={mode} className={styles.bodyModeOption} htmlFor={id}>
              <input
                id={id}
                type="radio"
                name="external-services-body-mode"
                value={mode}
                checked={selected === mode}
                disabled={disabled}
                data-testid={id}
                onChange={() => {
                  onChange(mode);
                }}
              />
              <span className={styles.bodyModeRadio} aria-hidden="true" />
              <span className={styles.bodyModeLabel}>{t(bodyModeKeys[mode])}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
