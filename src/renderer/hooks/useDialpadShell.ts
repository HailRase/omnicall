import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  deriveAuthShellFlags,
  deriveDialpadDisabledReason,
  isDialpadNumberValid,
  resolveVideoCallAvailability,
  type CallProjection,
  type AccountBootstrapProjection,
  type DialpadMode,
  type MultiCallProjection,
} from "@application/index.js";
import { mapDialpadDisabledReason } from "../helpers/mapDialpadDisabledReason.js";
import { mapVideoCallDisabledReason } from "../helpers/mapVideoCallDisabledReason.js";

type UseDialpadShellResult = Readonly<{
  dialedNumber: string;
  setDialedNumber: Dispatch<SetStateAction<string>>;
  deleteLastDialedDigit: () => void;
  clearDialedNumber: () => void;
  dialpadMode: DialpadMode;
  isCalling: boolean;
  callDisabledReason: string | null;
  videoCallDisabledReason: string | null;
  inputDisabledReason: string | null;
}>;

/**
 * - Purpose: derive dialpad UI state from projections and local dialed number.
 * - Inputs: account and call projections from store.
 * - Outputs: dialpad values, disabled reasons (audio + video), and number change setter.
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

  const videoAvailability = useMemo(
    () =>
      resolveVideoCallAvailability({
        numberValid: !hasInvalidNumber,
        sipRegistered: isSipRegistered,
        secondSessionBlocked: multiCallProjection.isSecondSessionDisabled,
        holdAllInProgress: multiCallProjection.holdAllInProgress,
        // Capture probe UI wiring lands with device settings; allow dial when feature ready.
        videoCaptureAvailable: true,
        videoFeatureReady: true,
      }),
    [
      hasInvalidNumber,
      isSipRegistered,
      multiCallProjection.holdAllInProgress,
      multiCallProjection.isSecondSessionDisabled,
    ],
  );

  const videoCallDisabledReason = useMemo(() => {
    if (isCalling) {
      return mapDialpadDisabledReason("disabledByConnectingInProgress");
    }
    if (!videoAvailability.enabled) {
      return mapVideoCallDisabledReason(videoAvailability.reason);
    }
    return null;
  }, [isCalling, videoAvailability]);

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
    videoCallDisabledReason,
    inputDisabledReason: isSipRegistered
      ? null
      : mapDialpadDisabledReason("disabledByNotRegistered"),
  };
}
