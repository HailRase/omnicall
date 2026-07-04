import clsx from "clsx";

import { useRef, type ChangeEvent, type JSX, type KeyboardEvent } from "react";

import { useI18n } from "../../i18n/index.js";

import { AppIcon } from "../icons/AppIcon.js";

import { IconControlButton, IconTooltip } from "../icons/index.js";

import dismissStyles from "../icons/iconOverlayDismiss.module.css";

import styles from "./Dialpad.module.css";



export type DialpadMode = "number" | "dtmf";



export type DialpadProps = Readonly<{

  numberValue: string;

  mode: DialpadMode;

  isCalling: boolean;

  callDisabledReason: string | null;

  inputDisabledReason: string | null;

  hasEstablishedCall?: boolean;

  overlayMode?: boolean;

  onNumberChange: (value: string) => void;

  onDelete: () => void;

  onClear: () => void;

  onCall: () => void;

  onSendDtmf: (tone: string) => void;

  onModeChange: (mode: DialpadMode) => void;

  onClose?: () => void;

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

const LONG_PRESS_CLEAR_MS = 500;



/**

 * - Purpose: reference-aligned number dialpad with full-width call action.

 * - Inputs: number value, disabled reasons, established-call flag, dial callbacks.

 * - Outputs: accessible dialpad UI without business logic.

 * @uiMeta lf=LF-020 f=F-003,F-016,F-021 smoke=R7-*

 */

export function Dialpad({

  numberValue,

  mode,

  isCalling,

  callDisabledReason,

  inputDisabledReason,

  hasEstablishedCall = false,

  overlayMode = false,

  onNumberChange,

  onDelete,

  onClear,

  onCall,

  onClose,

}: DialpadProps): JSX.Element | null {

  const { t } = useI18n();

  const zeroPressTimeout = useRef<number | null>(null);

  const longPressTriggered = useRef(false);

  const isZeroPressing = useRef(false);

  const deletePressTimeout = useRef<number | null>(null);

  const deleteLongPressTriggered = useRef(false);

  const isDeletePressing = useRef(false);



  if (mode === "dtmf") {

    return null;

  }



  const showKeys = overlayMode || !hasEstablishedCall || numberValue.length > 0;

  const isInputDisabled = inputDisabledReason !== null;

  const canDial = callDisabledReason === null && numberValue.trim().length > 0 && !isCalling;

  const callLabel = t("dialpad.call.label");

  const connectingLabel = t("dialpad.call.connectingLabel");



  const handleKeyPress = (key: string): void => {

    if (isInputDisabled) {

      return;

    }

    onNumberChange(numberValue + key);

  };



  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {

    if (isInputDisabled) {

      return;

    }

    onNumberChange(event.currentTarget.value);

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



  const handleDeletePressStart = (): void => {

    if (isInputDisabled) {

      return;

    }

    isDeletePressing.current = true;

    deleteLongPressTriggered.current = false;

    deletePressTimeout.current = window.setTimeout(() => {

      deleteLongPressTriggered.current = true;

      onClear();

    }, LONG_PRESS_CLEAR_MS);

  };



  const handleDeletePressEnd = (): void => {

    if (!isDeletePressing.current) {

      return;

    }



    isDeletePressing.current = false;



    if (deletePressTimeout.current !== null) {

      window.clearTimeout(deletePressTimeout.current);

      deletePressTimeout.current = null;

    }



    if (!deleteLongPressTriggered.current) {

      onDelete();

    }

  };



  return (

    <section

      className={clsx(

        styles.panel,

        isInputDisabled && styles.panelInputDisabled,

        overlayMode && styles.panelOverlay,

      )}

      data-testid="dialpad-panel"

      onKeyDown={handleKeyboard}

      aria-label={t("dialpad.panel.ariaLabel")}

      aria-disabled={isInputDisabled}

    >

      {onClose !== undefined ? (

        <div className={styles.overlayHeader}>

          <span className={styles.overlayTitle}>{t("dialpad.panel.overlayTitle")}</span>

          <IconControlButton

            iconId="overlay.close"

            ariaLabel={t("dialpad.panel.overlayCloseAria")}

            tooltipLabel={t("icons.overlay.close")}

            testId="dialpad-overlay-close"

            className={dismissStyles.dismiss}

            onClick={onClose}

          />

        </div>

      ) : null}



      <div className={styles.inputRow}>

        <input

          type="tel"

          className={styles.inputField}

          data-testid="dialpad-input"

          value={numberValue}

          placeholder={inputDisabledReason ?? t("dialpad.input.placeholder")}

          aria-label={t("dialpad.input.ariaLabel")}

          disabled={isInputDisabled}

          onChange={handleInputChange}

        />

        {numberValue.length > 0 ? (

          <IconControlButton

            iconId="dial.delete"

            ariaLabel={t("dialpad.input.deleteAria")}

            tooltipLabel={t("dialpad.input.deleteTooltip")}

            testId="dialpad-delete"

            className={styles.deleteButton}

            disabledReason={inputDisabledReason}

            onMouseDown={handleDeletePressStart}

            onMouseUp={handleDeletePressEnd}

            onMouseLeave={handleDeletePressEnd}

          />

        ) : null}

      </div>



      {showKeys ? (

        <div className={styles.keys} role="group" aria-label={t("dialpad.keys.ariaLabel")}>

          {KEYS.map(([key, sublabel]) => {

            if (key === "0") {

              return (

                <button

                  key={key}

                  type="button"

                  className={clsx(styles.key, isInputDisabled && styles.keyDisabled)}

                  data-testid="dialpad-key-0"

                  aria-label={t("dialpad.keys.dialAria", { key: "0" })}

                  disabled={isInputDisabled}

                  onMouseDown={handleZeroPressStart}

                  onMouseUp={handleZeroPressEnd}

                  onMouseLeave={handleZeroPressEnd}

                >

                  <span className={styles.keyDigit}>0</span>

                </button>

              );

            }



            return (

              <button

                key={key}

                type="button"

                className={clsx(styles.key, isInputDisabled && styles.keyDisabled)}

                data-testid={`dialpad-key-${key}`}

                aria-label={t("dialpad.keys.dialAria", { key })}

                disabled={isInputDisabled}

                onClick={() => {

                  handleKeyPress(key);

                }}

              >

                <span className={styles.keyDigit}>{key}</span>

                {sublabel !== null ? (

                  <span className={styles.keySub}>{sublabel}</span>

                ) : null}

              </button>

            );

          })}

        </div>

      ) : null}



      <IconTooltip
        label={callDisabledReason ?? callLabel}
        className={styles.callButtonTooltipHost}
      >
        <button
          type="button"
          className={clsx(
            styles.callButton,
            canDial && styles.callButtonReady,
            isCalling && styles.callButtonBusy,
          )}
          data-testid="dialpad-call"
          aria-label={isCalling ? t("dialpad.call.connectingAria") : t("dialpad.call.ariaLabel")}
          disabled={!canDial}
          onClick={onCall}
        >
          <AppIcon id="dial.call" size={18} decorative />
          {!canDial && callDisabledReason !== null && numberValue.length === 0 ? (
            <span className={styles.callButtonReason}>{callDisabledReason}</span>
          ) : (
            <span className={styles.callButtonLabel}>
              {isCalling ? connectingLabel : callLabel}
            </span>
          )}
        </button>
      </IconTooltip>

    </section>

  );

}

