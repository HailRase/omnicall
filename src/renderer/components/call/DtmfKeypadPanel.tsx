import type { JSX } from "react";
import { useI18n } from "../../i18n/index.js";
import { IconControlButton } from "../icons/index.js";
import dismissStyles from "../icons/iconOverlayDismiss.module.css";
import styles from "./DtmfKeypadPanel.module.css";

const DTMF_KEYS: ReadonlyArray<string> = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#",
];

export type DtmfKeypadPanelProps = Readonly<{
  displayName: string;
  toneHistory: string;
  lastTone: string | null;
  errorMessage?: string | null;
  onTone: (tone: string) => void;
  onClose: () => void;
}>;

/**
 * - Purpose: contextual DTMF keypad aligned with dialpad overlay layout.
 * - Inputs: line label, tone history, tone and close callbacks.
 * - Outputs: DTMF grid with stable title row and separate tone display field.
 * @uiMeta lf=LF-024 f=F-008,F-016
 */
export function DtmfKeypadPanel({
  displayName,
  toneHistory,
  lastTone,
  errorMessage = null,
  onTone,
  onClose,
}: DtmfKeypadPanelProps): JSX.Element {
  const { t } = useI18n();
  const toneDisplay =
    toneHistory.length > 0 ? toneHistory : lastTone !== null ? lastTone : "";
  const toneTestId =
    toneHistory.length > 0
      ? "dtmf-tone-history"
      : lastTone !== null
        ? "dtmf-last-tone"
        : undefined;

  return (
    <section
      className={styles.panel}
      data-testid="dtmf-keypad-panel"
      aria-label={t("call.dtmf.panelAriaLabel")}
    >
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          {t("call.dtmf.title", { displayName })}
        </span>
        <IconControlButton
          iconId="overlay.close"
          ariaLabel={t("call.dtmf.closeAriaLabel")}
          tooltipLabel={t("icons.overlay.close")}
          testId="dtmf-close"
          className={dismissStyles.dismiss}
          onClick={onClose}
        />
      </div>

      <div className={styles.inputRow}>
        <input
          type="text"
          readOnly
          className={styles.toneField}
          value={toneDisplay}
          placeholder={t("call.dtmf.placeholder")}
          aria-label={t("call.dtmf.tonesAriaLabel")}
          aria-live="polite"
          {...(toneTestId !== undefined ? { "data-testid": toneTestId } : {})}
        />
      </div>

      <div className={styles.keys} role="group" aria-label={t("call.dtmf.keysAriaLabel")}>
        {DTMF_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={styles.key}
            data-testid={`dtmf-key-${key}`}
            aria-label={`DTMF ${key}`}
            onClick={() => {
              onTone(key);
            }}
          >
            <span className={styles.keyDigit}>{key}</span>
          </button>
        ))}
      </div>

      {errorMessage !== null ? (
        <p className={styles.error} data-testid="dtmf-error-alert" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <p className={styles.hint}>{t("call.dtmf.hint")}</p>
    </section>
  );
}
