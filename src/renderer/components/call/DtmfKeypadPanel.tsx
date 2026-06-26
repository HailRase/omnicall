import type { JSX } from "react";
import { IconControlButton } from "../icons/index.js";
import styles from "./DtmfKeypadPanel.module.css";

const DTMF_KEYS: ReadonlyArray<string> = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#",
];

export type DtmfKeypadPanelProps = Readonly<{
  displayName: string;
  lastTone: string | null;
  onTone: (tone: string) => void;
  onClose: () => void;
}>;

/**
 * - Purpose: contextual DTMF keypad replacing session area during tone dialing.
 * - Inputs: active line label, last tone, tone and close callbacks.
 * - Outputs: full-width DTMF grid without number dial confusion.
 * @uiMeta lf=LF-024 f=F-008,F-016
 */
export function DtmfKeypadPanel({
  displayName,
  lastTone,
  onTone,
  onClose,
}: DtmfKeypadPanelProps): JSX.Element {
  return (
    <section className={styles["panel"]} data-testid="dtmf-keypad-panel" aria-label="Тоновый набор">
      <header className={styles["header"]}>
        <div className={styles["headerText"]}>
          <p className={styles["title"]}>Тоновый набор (DTMF)</p>
          <p className={styles["subtitle"]}>{displayName}</p>
        </div>
        <div className={styles["headerAside"]}>
          {lastTone !== null ? (
            <div className={styles["lastTone"]}>
              <span className={styles["lastToneLabel"]}>Последний тон</span>
              <span className={styles["lastToneValue"]} data-testid="dtmf-last-tone">
                {lastTone}
              </span>
            </div>
          ) : null}
          <IconControlButton
            iconId="overlay.close"
            ariaLabel="Закрыть тоновый набор"
            tooltipLabel="Закрыть"
            testId="dtmf-close"
            className={styles["closeButton"]}
            onClick={onClose}
          />
        </div>
      </header>
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
            {key}
          </button>
        ))}
      </div>
      <p className={styles["hint"]}>Тоны передаются в активный звонок</p>
    </section>
  );
}
