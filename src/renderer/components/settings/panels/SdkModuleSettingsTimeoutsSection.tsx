import type { JSX } from "react";
import type { SdkOperatorModalTimeouts } from "@shared/integration/sdkOperatorModalTimeouts.js";
import {
  SDK_OPERATOR_CONSENT_TTL_PRESETS_MS,
  SDK_OPERATOR_ORIGIN_TRUST_TTL_PRESETS_MS,
  SDK_OPERATOR_PAIRING_TTL_PRESETS_MS,
} from "@shared/integration/sdkOperatorModalTimeouts.js";
import { useI18n } from "../../../i18n/index.js";
import { FormField, Select } from "../../ui/index.js";
import type { SelectItemOption } from "../../ui/select/Select.js";
import formStyles from "../SettingsForm.module.css";
import styles from "./SdkModuleSettingsCard.module.css";

type Props = Readonly<{
  timeouts: SdkOperatorModalTimeouts;
  busy: boolean;
  onChange: (next: Partial<SdkOperatorModalTimeouts>) => void;
}>;

function formatTimeoutOptionLabel(
  ms: number,
  t: ReturnType<typeof useI18n>["t"],
): string {
  if (ms < 60_000) {
    return t("settings.integrations.sdk.timeouts.option.seconds", {
      count: Math.round(ms / 1_000),
    });
  }
  return t("settings.integrations.sdk.timeouts.option.minutes", {
    count: Math.round(ms / 60_000),
  });
}

function toItems(
  presets: readonly number[],
  t: ReturnType<typeof useI18n>["t"],
): readonly SelectItemOption[] {
  return presets.map((ms) => ({
    value: String(ms),
    label: formatTimeoutOptionLabel(ms, t),
  }));
}

/**
 * - Purpose: Settings → Axatalk SDK → Main — operator modal TTL selects (Desktop SSoT).
 * @uiMeta f=F-011 lf=LF-051
 */
export function SdkModuleSettingsTimeoutsSection({
  timeouts,
  busy,
  onChange,
}: Props): JSX.Element {
  const { t } = useI18n();
  const consentItems = toItems(SDK_OPERATOR_CONSENT_TTL_PRESETS_MS, t);
  const originItems = toItems(SDK_OPERATOR_ORIGIN_TRUST_TTL_PRESETS_MS, t);
  const pairingItems = toItems(SDK_OPERATOR_PAIRING_TTL_PRESETS_MS, t);

  return (
    <div className={formStyles.settingBlock} data-testid="sdk-module-timeouts">
      <p className={formStyles.fieldLabel}>
        {t("settings.integrations.sdk.timeouts.title")}
      </p>
      <p className={formStyles.blockHint}>
        {t("settings.integrations.sdk.timeouts.hint")}
      </p>
      <div className={styles.timeoutsList}>
        <FormField
          label={t("settings.integrations.sdk.timeouts.consent")}
          disabled={busy}
          className={styles.timeoutField}
        >
          <Select
            id="sdk-timeout-consent"
            className={styles.timeoutSelect}
            size="sm"
            items={consentItems}
            value={String(timeouts.consentTtlMs)}
            disabled={busy}
            data-testid="sdk-timeout-consent"
            onValueChange={(value) => {
              const consentTtlMs = Number(value);
              if (Number.isFinite(consentTtlMs)) {
                onChange({ consentTtlMs });
              }
            }}
          />
        </FormField>
        <FormField
          label={t("settings.integrations.sdk.timeouts.originTrust")}
          disabled={busy}
          className={styles.timeoutField}
        >
          <Select
            id="sdk-timeout-origin-trust"
            className={styles.timeoutSelect}
            size="sm"
            items={originItems}
            value={String(timeouts.originTrustTtlMs)}
            disabled={busy}
            data-testid="sdk-timeout-origin-trust"
            onValueChange={(value) => {
              const originTrustTtlMs = Number(value);
              if (Number.isFinite(originTrustTtlMs)) {
                onChange({ originTrustTtlMs });
              }
            }}
          />
        </FormField>
        <FormField
          label={t("settings.integrations.sdk.timeouts.pairing")}
          disabled={busy}
          className={styles.timeoutField}
        >
          <Select
            id="sdk-timeout-pairing"
            className={styles.timeoutSelect}
            size="sm"
            items={pairingItems}
            value={String(timeouts.pairingTtlMs)}
            disabled={busy}
            data-testid="sdk-timeout-pairing"
            onValueChange={(value) => {
              const pairingTtlMs = Number(value);
              if (Number.isFinite(pairingTtlMs)) {
                onChange({ pairingTtlMs });
              }
            }}
          />
        </FormField>
      </div>
    </div>
  );
}
