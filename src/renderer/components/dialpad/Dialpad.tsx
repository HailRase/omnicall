import clsx from "clsx";
import { useRef, type JSX, type KeyboardEvent } from "react";
import { AppIcon } from "../icons/AppIcon.js";
import { IconControlButton } from "../icons/index.js";
import styles from "./Dialpad.module.css";

export type DialpadMode = "number" | "dtmf";

export type DialpadProps = Readonly<{
  numberValue: string;
  mode: DialpadMode;
  isCalling: boolean;
  callDisabledReason: string | null;
  inputDisabledReason: string | null;
  hasEstablishedCall?: boolean;
  onNumberChange: (value: string) => void;
  onDelete: () => void;
  onCall: () => void;
  onSendDtmf: (tone: string) => void;
  onModeChange: (mode: DialpadMode) => void;
}>;

const KEYS: ReadonlyArray<readonly [string, string | null]> = [
  ["1", null],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
  ["*", null],
  ["0", null],
  ["#", null],
];

const LONG_PRESS_ZERO_MS = 450;

/**
 * - Purpose: reference-aligned number dialpad with full-width call action.
 * - Inputs: number value, disabled reasons, established-call flag, dial callbacks.
 * - Outputs: accessible dialpad UI without business logic.
 * @uiMeta lf=LF-020 f=F-003,F-016 smoke=R7-*
 */
export function Dialpad({
  numberValue,
  mode,
  isCalling,
  callDisabledReason,
  inputDisabledReason,
  hasEstablishedCall = false,
  onNumberChange,
  onDelete,
  onCall,
}: DialpadProps): JSX.Element | null {
  const zeroPressTimeout = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const isZeroPressing = useRef(false);

  if (mode === "dtmf") {
    return null;
  }

  const showKeys = !hasEstablishedCall || numberValue.length > 0;
  const isInputDisabled = inputDisabledReason !== null;
  const canDial = callDisabledReason === null && numberValue.trim().length > 0 && !isCalling;

  const handleKeyPress = (key: string): void => {
    if (isInputDisabled) {
      return;
    }
    onNumberChange(numberValue + key);
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLElement>): void => {
    if (isInputDisabled) {
      return;
    }
    if (event.key === "Enter" && canDial) {
      event.preventDefault();
      onCall();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      onDelete();
      return;
    }

    if (event.key === "+") {
      event.preventDefault();
      onNumberChange(numberValue + "+");
      return;
    }

    const digit = KEYS.find(([key]) => key === event.key);
    if (digit !== undefined) {
      event.preventDefault();
      handleKeyPress(digit[0]);
    }
  };

  const handleZeroPressStart = (): void => {
    if (isInputDisabled) {
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
      className={clsx(styles["panel"], isInputDisabled && styles["panelInputDisabled"])}
      data-testid="dialpad-panel"
      onKeyDown={handleKeyboard}
      aria-label="Панель набора номера"
      aria-disabled={isInputDisabled}
    >
      <div className={styles["inputRow"]}>
        <span className={styles["inputDisplay"]} data-testid="dialpad-input" aria-label="Поле ввода номера">
          {numberValue.length > 0 ? (
            <span className={styles["inputValue"]}>{numberValue}</span>
          ) : (
            <span className={styles["inputPlaceholder"]}>
              {inputDisabledReason ?? "Введите номер"}
            </span>
          )}
        </span>
        {numberValue.length > 0 ? (
          <IconControlButton
            iconId="dial.delete"
            ariaLabel="Удалить символ"
            tooltipLabel="Удалить символ"
            testId="dialpad-delete"
            className={styles["deleteButton"]}
            disabledReason={inputDisabledReason}
            onClick={onDelete}
          />
        ) : null}
      </div>

      {showKeys ? (
        <div className={styles["keys"]} role="group" aria-label="Клавиши набора">
          {KEYS.map(([key, sublabel]) => {
            if (key === "0") {
              return (
                <button
                  key={key}
                  type="button"
                  className={clsx(styles["key"], isInputDisabled && styles["keyDisabled"])}
                  data-testid="dialpad-key-0"
                  aria-label="Набрать 0"
                  disabled={isInputDisabled}
                  onMouseDown={handleZeroPressStart}
                  onMouseUp={handleZeroPressEnd}
                  onMouseLeave={handleZeroPressEnd}
                >
                  <span className={styles["keyDigit"]}>0</span>
                </button>
              );
            }

            return (
              <button
                key={key}
                type="button"
                className={clsx(styles["key"], isInputDisabled && styles["keyDisabled"])}
                data-testid={`dialpad-key-${key}`}
                aria-label={`Набрать ${key}`}
                disabled={isInputDisabled}
                onClick={() => {
                  handleKeyPress(key);
                }}
              >
                <span className={styles["keyDigit"]}>{key}</span>
                {sublabel !== null ? (
                  <span className={styles["keySub"]}>{sublabel}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        className={clsx(
          styles["callButton"],
          canDial && styles["callButtonReady"],
          isCalling && styles["callButtonBusy"],
        )}
        data-testid="dialpad-call"
        aria-label={isCalling ? "Соединение выполняется" : "Позвонить"}
        disabled={!canDial}
        title={callDisabledReason ?? "Позвонить"}
        onClick={onCall}
      >
        <AppIcon id="dial.call" size={18} decorative />
        {!canDial && callDisabledReason !== null && numberValue.length === 0 ? (
          <span className={styles["callButtonReason"]}>{callDisabledReason}</span>
        ) : (
          <span className={styles["callButtonLabel"]}>Позвонить</span>
        )}
      </button>
    </section>
  );
}
