import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  deriveAuthShellFlags,
  deriveDialpadDisabledReason,
  isDialpadNumberValid,
  type CallProjection,
  type AccountBootstrapProjection,
  type DialpadMode,
  type MultiCallProjection,
} from "@application/index.js";
import { mapDialpadDisabledReason } from "../helpers/mapDialpadDisabledReason.js";

type UseDialpadShellResult = Readonly<{
  dialedNumber: string;
  setDialedNumber: Dispatch<SetStateAction<string>>;
  deleteLastDialedDigit: () => void;
  clearDialedNumber: () => void;
  dialpadMode: DialpadMode;
  isCalling: boolean;
  callDisabledReason: string | null;
  inputDisabledReason: string | null;
}>;

/**
 * - Purpose: derive dialpad UI state from projections and local dialed number.
 * - Inputs: account and call projections from store.
 * - Outputs: dialpad values, disabled reason, and number change setter.
 */
export function useDialpadShell(
  projection: AccountBootstrapProjection,
  callProjection: CallProjection,
  multiCallProjection: MultiCallProjection,
): UseDialpadShellResult {
  const [dialedNumber, setDialedNumber] = useState("");

  const { isSipRegistered } = deriveAuthShellFlags(projection);
  const isCalling = callProjection.state === "Connecting";
  const hasInvalidNumber = !isDialpadNumberValid(dialedNumber);
  const ocpReserved = projection.isOcpMode && projection.phoneStatus === "dnd";

  const disabledState = useMemo(
    () =>
      deriveDialpadDisabledReason({
        isRegistered: isSipRegistered,
        isOcpReserved: ocpReserved,
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
      ocpReserved,
    ],
  );

  return {
    dialedNumber,
    setDialedNumber,
    deleteLastDialedDigit: () => {
      setDialedNumber((previous) => previous.slice(0, -1));
    },
    clearDialedNumber: () => {
      setDialedNumber("");
    },
    dialpadMode: callProjection.mode,
    isCalling,
    callDisabledReason: mapDialpadDisabledReason(disabledState),
    inputDisabledReason: isSipRegistered
      ? null
      : mapDialpadDisabledReason("disabledByNotRegistered"),
  };
}
