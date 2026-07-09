import { useCallback } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { CallVideoMediaState, SessionViewMode } from "@application/index.js";
import {
  areCameraControlsEnabled,
  isScreenShareAllowed,
} from "@application/index.js";

type UseVideoCallActionsInput = Readonly<{
  facade: AccountBootstrapFacade;
}>;

type UseVideoCallActionsResult = Readonly<{
  handleToggleCamera: (callId: string, state: CallVideoMediaState) => void;
  handleToggleScreenShare: (callId: string, state: CallVideoMediaState) => void;
  handleSetSessionView: (callId: string, sessionView: SessionViewMode) => void;
  bindVideoSurfaces: (
    callId: string,
    remoteVideoElement: HTMLVideoElement,
    localVideoElement: HTMLVideoElement,
  ) => void;
}>;

/**
 * - Purpose: bind video mute/source/view intents to facade Use Cases.
 * - Inputs: account bootstrap facade.
 * - Outputs: guarded handlers for CallControlsBar and CallVideoSurface.
 */
export function useVideoCallActions(
  input: UseVideoCallActionsInput,
): UseVideoCallActionsResult {
  const { facade } = input;

  const handleToggleCamera = useCallback(
    (callId: string, state: CallVideoMediaState): void => {
      if (!areCameraControlsEnabled(state)) {
        return;
      }
      void facade.setLocalVideoMutedById(callId, !state.localVideoMuted);
    },
    [facade],
  );

  const handleToggleScreenShare = useCallback(
    (callId: string, state: CallVideoMediaState): void => {
      if (state.mediaMode !== "video") {
        return;
      }
      if (state.localVideoSource === "screen") {
        void facade.switchLocalVideoSourceById(callId, "camera", true);
        return;
      }
      if (!isScreenShareAllowed(state)) {
        return;
      }
      void facade.switchLocalVideoSourceById(callId, "screen", false);
    },
    [facade],
  );

  const handleSetSessionView = useCallback(
    (callId: string, sessionView: SessionViewMode): void => {
      facade.setSessionViewModeById(callId, sessionView);
    },
    [facade],
  );

  const bindVideoSurfaces = useCallback(
    (
      callId: string,
      remoteVideoElement: HTMLVideoElement,
      localVideoElement: HTMLVideoElement,
    ): void => {
      void facade.bindCallVideoSurfacesById(
        callId,
        remoteVideoElement,
        localVideoElement,
      );
    },
    [facade],
  );

  return {
    handleToggleCamera,
    handleToggleScreenShare,
    handleSetSessionView,
    bindVideoSurfaces,
  };
}
