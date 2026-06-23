import { useRef, type JSX, type KeyboardEvent } from "react";

export type DialpadMode = "number" | "dtmf";

export type DialpadProps = Readonly<{
  numberValue: string;
  mode: DialpadMode;
  isCalling: boolean;
  callDisabledReason: string | null;
  onNumberChange: (value: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onCall: () => void;
  onSendDtmf: (tone: string) => void;
  onModeChange: (mode: DialpadMode) => void;
}>;

const KEYS: ReadonlyArray<string> = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const LONG_PRESS_ZERO_MS = 450;

export function Dialpad({
  numberValue,
  mode,
  isCalling,
  callDisabledReason,
  onNumberChange,
  onDelete,
  onClear,
  onCall,
  onSendDtmf,
  onModeChange,
}: DialpadProps): JSX.Element {
  const zeroPressTimeout = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

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

    longPressTriggered.current = false;
    zeroPressTimeout.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      onNumberChange(numberValue + "+");
    }, LONG_PRESS_ZERO_MS);
  };

  const handleZeroPressEnd = (): void => {
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
      className="dialpad"
      data-testid="dialpad-panel"
      onKeyDown={handleKeyboard}
      aria-label="Dialpad panel"
    >
      <header className="dialpad__header">
        <h2>Dialpad</h2>
        <div className="dialpad__mode" role="group" aria-label="Dialpad mode">
          <button
            type="button"
            className={mode === "number" ? "is-active" : ""}
            onClick={() => onModeChange("number")}
            data-testid="dialpad-mode-number"
          >
            Number
          </button>
          <button
            type="button"
            className={mode === "dtmf" ? "is-active" : ""}
            onClick={() => onModeChange("dtmf")}
            data-testid="call-dtmf-toggle"
          >
            DTMF
          </button>
        </div>
      </header>

      <label className="dialpad__input-label" htmlFor="dialpad-input">
        Number
      </label>
      <input
        id="dialpad-input"
        className="dialpad__input"
        value={numberValue}
        onChange={(event) => onNumberChange(event.currentTarget.value)}
        data-testid="dialpad-input"
        aria-label="Phone number input"
      />

      <div className="dialpad__keys" role="group" aria-label="Dialpad keys">
        {KEYS.map((key) => {
          if (key === "0") {
            return (
              <button
                key={key}
                type="button"
                data-testid="dialpad-key-0"
                aria-label={mode === "dtmf" ? "DTMF 0" : "Dial 0"}
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
              data-testid={`dialpad-key-${key}`}
              aria-label={mode === "dtmf" ? `DTMF ${key}` : `Dial ${key}`}
              onClick={() => handleKeyPress(key)}
            >
              {key}
            </button>
          );
        })}
      </div>

      <div className="dialpad__actions">
        <button type="button" onClick={onDelete} data-testid="dialpad-delete">
          Delete
        </button>
        <button type="button" onClick={onClear} data-testid="dialpad-clear">
          Clear
        </button>
        <button
          type="button"
          onClick={onCall}
          data-testid="dialpad-call"
          disabled={callDisabledReason !== null || isCalling}
          aria-label="Call"
        >
          {isCalling ? "Calling..." : "Call"}
        </button>
      </div>

      {callDisabledReason !== null && (
        <p
          className="dialpad__disabled-reason"
          data-testid="dialpad-disabled-reason"
          role="status"
        >
          {callDisabledReason}
        </p>
      )}
    </section>
  );
}

