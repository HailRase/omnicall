import clsx from "clsx";
import { useRef, type JSX, type KeyboardEvent } from "react";
import { IconControlButton } from "../icons/index.js";
import styles from "./Dialpad.module.css";

export type DialpadMode = "number" | "dtmf";

export type DialpadProps = Readonly<{
  numberValue: string;
  mode: DialpadMode;
  isCalling: boolean;
  callDisabledReason: string | null;
  onNumberChange: (value: string) => void;
  onDelete: () => void;
  onCall: () => void;
  onSendDtmf: (tone: string) => void;
  onModeChange: (mode: DialpadMode) => void;
}>;

const KEYS: ReadonlyArray<string> = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const LONG_PRESS_ZERO_MS = 450;

/**
 * - Purpose: primary home-screen dialpad with split input and call action.
 * - Inputs: number value, mode, disabled reasons, and dial callbacks.
 * - Outputs: accessible dialpad UI without business logic.
 * @uiMeta lf=LF-020 f=F-003,F-016 smoke=R7-*
 */
export function Dialpad({
  numberValue,
  mode,
  isCalling,
  callDisabledReason,
  onNumberChange,
  onDelete,
  onCall,
  onSendDtmf,
  onModeChange,
}: DialpadProps): JSX.Element {
  const zeroPressTimeout = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const isZeroPressing = useRef(false);

  const handleKeyPress = (key: string): void => {
    if (mode === "dtmf") {
      onSendDtmf(key);
      return;
    }

    onNumberChange(numberValue + key);
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Enter" && callDisabledReason === null) {
      event.preventDefault();
      onCall();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      onDelete();
      return;
    }

    if (event.key === "+" && mode === "number") {
      event.preventDefault();
      onNumberChange(numberValue + "+");
      return;
    }

    if (KEYS.includes(event.key)) {
      event.preventDefault();
      handleKeyPress(event.key);
    }
  };

  const handleZeroPressStart = (): void => {
    if (mode !== "number") {
      return;
    }

    isZeroPressing.current = true;
    longPressTriggered.current = false;
    zeroPressTimeout.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      onNumberChange(numberValue + "+");
    }, LONG_PRESS_ZERO_MS);
  };

  const handleZeroPressEnd = (): void => {
    if (!isZeroPressing.current) {
      return;
    }

    isZeroPressing.current = false;

    if (zeroPressTimeout.current !== null) {
      window.clearTimeout(zeroPressTimeout.current);
      zeroPressTimeout.current = null;
    }

    if (!longPressTriggered.current) {
      handleKeyPress("0");
    }
  };

  return (
    <section
      className={styles["panel"]}
      data-testid="dialpad-panel"
      onKeyDown={handleKeyboard}
      aria-label="Панель набора номера"
    >
      <div className={styles["modeRow"]}>
        <div className={styles["mode"]} role="group" aria-label="Режим набора">
          <button
            type="button"
            className={clsx(styles["modeButton"], mode === "number" && styles["modeActive"])}
            onClick={() => onModeChange("number")}
            data-testid="dialpad-mode-number"
          >
            Номер
          </button>
          <button
            type="button"
            className={clsx(styles["modeButton"], mode === "dtmf" && styles["modeActive"])}
            onClick={() => onModeChange("dtmf")}
            data-testid="call-dtmf-toggle"
          >
            DTMF
          </button>
        </div>
      </div>

      <div className={styles["splitRow"]}>
        <div className={styles["inputGroup"]}>
          <input
            id="dialpad-input"
            className={styles["input"]}
            value={numberValue}
            onChange={(event) => onNumberChange(event.currentTarget.value)}
            data-testid="dialpad-input"
            aria-label="Поле ввода номера"
            placeholder="Номер"
          />
          {numberValue.length > 0 ? (
            <IconControlButton
              iconId="overlay.close"
              ariaLabel="Удалить цифру"
              tooltipLabel="Удалить цифру"
              testId="dialpad-delete"
              className={styles["deleteButton"]}
              onClick={onDelete}
            />
          ) : null}
        </div>
        <IconControlButton
          iconId="dial.call"
          ariaLabel={isCalling ? "Соединение выполняется" : "Позвонить"}
          tooltipLabel={isCalling ? "Соединение выполняется" : "Позвонить"}
          testId="dialpad-call"
          className={clsx(styles["callButton"], isCalling && styles["callButtonBusy"])}
          disabledReason={callDisabledReason}
          disabled={isCalling}
          onClick={onCall}
        />
      </div>

      <div className={styles["keys"]} role="group" aria-label="Клавиши набора">
        {KEYS.map((key) => {
          if (key === "0") {
            if (mode === "dtmf") {
              return (
                <button
                  key={key}
                  type="button"
                  className={styles["key"]}
                  data-testid="dialpad-key-0"
                  aria-label="DTMF 0"
                  onClick={() => handleKeyPress("0")}
                >
                  0
                </button>
              );
            }

            return (
              <button
                key={key}
                type="button"
                className={styles["key"]}
                data-testid="dialpad-key-0"
                aria-label="Набрать 0"
                onMouseDown={handleZeroPressStart}
                onMouseUp={handleZeroPressEnd}
                onMouseLeave={handleZeroPressEnd}
              >
                0
              </button>
            );
          }

          return (
            <button
              key={key}
              type="button"
              className={styles["key"]}
              data-testid={`dialpad-key-${key}`}
              aria-label={mode === "dtmf" ? `DTMF ${key}` : `Набрать ${key}`}
              onClick={() => handleKeyPress(key)}
            >
              {key}
            </button>
          );
        })}
      </div>

      {callDisabledReason !== null && (
        <p
          className={styles["disabledReason"]}
          data-testid="dialpad-disabled-reason"
          role="status"
        >
          {callDisabledReason}
        </p>
      )}
    </section>
  );
}
