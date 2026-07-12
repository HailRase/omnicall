import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deriveIncomingCallGlobalOverlayVisible,
  type IncomingCallOverlayShellRouteName,
  type IncomingCallProjection,
} from "@application/index.js";

type UseIncomingCallOverlayShellInput = Readonly<{
  incomingCallProjection: IncomingCallProjection;
  shellRouteName: IncomingCallOverlayShellRouteName;
  incomingSessionCardVisible: boolean;
  videoFullscreen?: boolean;
}>;

type UseIncomingCallOverlayShellResult = Readonly<{
  visible: boolean;
  handleDismiss: () => void;
}>;

/**
 * - Purpose: derive global incoming overlay visibility and per-call dismiss state.
 * - Inputs: incoming projection, shell route, and inline session card visibility.
 * - Outputs: overlay visibility flag and dismiss handler scoped to callId.
 */
export function useIncomingCallOverlayShell(
  input: UseIncomingCallOverlayShellInput,
): UseIncomingCallOverlayShellResult {
  const { incomingCallProjection, shellRouteName, incomingSessionCardVisible, videoFullscreen } =
    input;
  const [dismissedCallId, setDismissedCallId] = useState<string | null>(null);

  const ringingCallId =
    incomingCallProjection.visible && incomingCallProjection.callId !== null
      ? incomingCallProjection.callId
      : null;

  useEffect(() => {
    if (ringingCallId === null) {
      setDismissedCallId(null);
    }
  }, [ringingCallId]);

  const visible = useMemo(
    () =>
      deriveIncomingCallGlobalOverlayVisible({
        incomingCallProjection,
        dismissedCallId,
        shellRouteName,
        incomingSessionCardVisible,
        ...(videoFullscreen === true ? { videoFullscreen: true } : {}),
      }),
    [
      dismissedCallId,
      incomingCallProjection,
      incomingSessionCardVisible,
      shellRouteName,
      videoFullscreen,
    ],
  );

  const handleDismiss = useCallback((): void => {
    if (ringingCallId === null) {
      return;
    }
    setDismissedCallId(ringingCallId);
  }, [ringingCallId]);

  return {
    visible,
    handleDismiss,
  };
}
