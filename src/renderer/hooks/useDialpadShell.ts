import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  buildDialpadHistoryNumbers,
  deriveAuthShellFlags,
  deriveDialpadDisabledReason,
  isDialpadNumberValid,
  resolveHistoryWalkStep,
  type CallProjection,
  type AccountBootstrapProjection,
  type DialpadMode,
  type MultiCallProjection,
} from "@application/index.js";
import { mapDialpadDisabledReason } from "../helpers/mapDialpadDisabledReason.js";

type UseDialpadShellInput = Readonly<{
  projection: AccountBootstrapProjection;
  callProjection: CallProjection;
  multiCallProjection: MultiCallProjection;
  historyRemoteNumbers: ReadonlyArray<string>;
}>;

type UseDialpadShellResult = Readonly<{
  dialedNumber: string;
  setDialedNumber: Dispatch<SetStateAction<string>>;
  deleteLastDialedDigit: () => void;
  clearDialedNumber: () => void;
  walkHistoryNewer: () => void;
  walkHistoryOlder: () => void;
  applyHistoryNumber: (number: string, walkIndex?: number) => void;
  historyNumbers: ReadonlyArray<string>;
  canRecallLastNumber: boolean;
  dialpadMode: DialpadMode;
  isCalling: boolean;
  callDisabledReason: string | null;
  inputDisabledReason: string | null;
}>;

/**
 * - Purpose: derive dialpad UI state, history recall walk, and disabled reasons.
 * - Inputs: account/call projections and newest-first history remote numbers.
 * - Outputs: dialpad values, recall helpers, and localized disabled reasons.
 */
export function useDialpadShell(input: UseDialpadShellInput): UseDialpadShellResult {
  const { projection, callProjection, multiCallProjection, historyRemoteNumbers } = input;
  const [dialedNumber, setDialedNumberState] = useState("");
  const [historyWalkIndex, setHistoryWalkIndex] = useState<number | null>(null);

  const historyNumbers = useMemo(
    () => buildDialpadHistoryNumbers(historyRemoteNumbers),
    [historyRemoteNumbers],
  );
  const canRecallLastNumber = historyNumbers.length > 0;

  const setDialedNumber = useCallback<Dispatch<SetStateAction<string>>>((value) => {
    setHistoryWalkIndex(null);
    setDialedNumberState(value);
  }, []);

  const applyHistoryNumber = useCallback((number: string, walkIndex = 0): void => {
    setHistoryWalkIndex(walkIndex);
    setDialedNumberState(number);
  }, []);

  const walkHistory = useCallback(
    (direction: "newer" | "older"): void => {
      const step = resolveHistoryWalkStep(historyNumbers, historyWalkIndex, direction);
      if (step === null) {
        return;
      }
      setHistoryWalkIndex(step.index);
      setDialedNumberState(step.number);
    },
    [historyNumbers, historyWalkIndex],
  );

  const { isSipRegistered } = deriveAuthShellFlags(projection);
  const isCalling = callProjection.state === "Connecting";
  const trimmed = dialedNumber.trim();
  const hasInvalidNumber =
    trimmed.length === 0
      ? !canRecallLastNumber
      : !isDialpadNumberValid(dialedNumber);

  const disabledState = useMemo(
    () =>
      deriveDialpadDisabledReason({
        isRegistered: isSipRegistered,
        isSecondSessionDisabled: multiCallProjection.isSecondSessionDisabled,
        secondSessionDisabledReason: multiCallProjection.secondSessionDisabledReason,
        isHoldAllInProgress: multiCallProjection.holdAllInProgress,
        isNumberValid: !hasInvalidNumber,
        isConnecting: isCalling,
      }),
    [
      isSipRegistered,
      hasInvalidNumber,
      isCalling,
      multiCallProjection.holdAllInProgress,
      multiCallProjection.isSecondSessionDisabled,
      multiCallProjection.secondSessionDisabledReason,
    ],
  );

  return {
    dialedNumber,
    setDialedNumber,
    deleteLastDialedDigit: () => {
      setHistoryWalkIndex(null);
      setDialedNumberState((previous) => previous.slice(0, -1));
    },
    clearDialedNumber: () => {
      setHistoryWalkIndex(null);
      setDialedNumberState("");
    },
    walkHistoryNewer: () => {
      walkHistory("newer");
    },
    walkHistoryOlder: () => {
      walkHistory("older");
    },
    applyHistoryNumber,
    historyNumbers,
    canRecallLastNumber,
    dialpadMode: callProjection.mode,
    isCalling,
    callDisabledReason: mapDialpadDisabledReason(disabledState),
    inputDisabledReason: isSipRegistered
      ? null
      : mapDialpadDisabledReason("disabledByNotRegistered"),
  };
}
