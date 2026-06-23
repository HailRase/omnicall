import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  deriveDialpadDisabledReason,
  isDialpadNumberValid,
  type CallProjection,
  type AccountBootstrapProjection,
  type DialpadMode,
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
}>;

/**
 * - Purpose: derive dialpad UI state from projections and local dialed number.
 * - Inputs: account and call projections from store.
 * - Outputs: dialpad values, disabled reason, and number change setter.
 */
export function useDialpadShell(
  projection: AccountBootstrapProjection,
  callProjection: CallProjection,
): UseDialpadShellResult {
  const [dialedNumber, setDialedNumber] = useState("");

  const blockingAuthState =
    projection.authUiState === "booting" ||
    projection.authUiState === "ocp_authenticating" ||
    projection.authUiState === "ocp_session_exists" ||
    projection.authUiState === "ocp_invalid_token" ||
    projection.authUiState === "sip_registering";

  const isCalling = callProjection.state === "Connecting";
  const hasInvalidNumber = !isDialpadNumberValid(dialedNumber);
  const secondSessionDisabled =
    callProjection.state !== "Idle" &&
    callProjection.state !== "Failed" &&
    callProjection.state !== "Ended";
  const ocpReserved = projection.isOcpMode && projection.phoneStatus === "dnd";

  const disabledState = useMemo(
    () =>
      deriveDialpadDisabledReason({
        isRegistered: !blockingAuthState && projection.authUiState === "sip_registered",
        isOcpReserved: ocpReserved,
        isSecondSessionDisabled:
          secondSessionDisabled && callProjection.state !== "Active",
        isNumberValid: !hasInvalidNumber,
        isConnecting: callProjection.state === "Connecting",
      }),
    [
      blockingAuthState,
      callProjection.state,
      hasInvalidNumber,
      ocpReserved,
      projection.authUiState,
      secondSessionDisabled,
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
  };
}
