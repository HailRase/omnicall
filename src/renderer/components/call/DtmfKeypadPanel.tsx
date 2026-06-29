import type { JSX } from "react";
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
  const toneDisplay =
    toneHistory.length > 0 ? toneHistory : lastTone !== null ? lastTone : "";
  const toneTestId =
    toneHistory.length > 0
      ? "dtmf-tone-history"
      : lastTone !== null
        ? "dtmf-last-tone"
        : undefined;

  return (
    <section className={styles["panel"]} data-testid="dtmf-keypad-panel" aria-label="Тоновый набор">
      <div className={styles["header"]}>
        <span className={styles["headerTitle"]}>Тоновый набор (DTMF) {displayName}</span>
        <IconControlButton
          iconId="overlay.close"
          ariaLabel="Закрыть тоновый набор"
          tooltipLabel="Закрыть"
          testId="dtmf-close"
          className={dismissStyles["dismiss"]}
          onClick={onClose}
        />
      </div>

      <div className={styles["inputRow"]}>
        <input
          type="text"
          readOnly
          className={styles["toneField"]}
          value={toneDisplay}
          placeholder="Тоны"
          aria-label="Набранные тоны"
          aria-live="polite"
          {...(toneTestId !== undefined ? { "data-testid": toneTestId } : {})}
        />
      </div>

      <div className={styles["keys"]} role="group" aria-label="Клавиши DTMF">
        {DTMF_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={styles["key"]}
            data-testid={`dtmf-key-${key}`}
            aria-label={`DTMF ${key}`}
            onClick={() => {
              onTone(key);
            }}
          >
            <span className={styles["keyDigit"]}>{key}</span>
          </button>
        ))}
      </div>

      {errorMessage !== null ? (
        <p className={styles["error"]} data-testid="dtmf-error-alert" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <p className={styles["hint"]}>Тоны передаются в активный звонок</p>
    </section>
  );
}
