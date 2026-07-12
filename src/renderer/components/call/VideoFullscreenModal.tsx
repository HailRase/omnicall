/**
 * - Purpose: edge-to-edge fullscreen video modal for F-027 session view.
 * - Inputs: call id, video state, control line, action callbacks.
 * - Outputs: fixed fullscreen surface with PiP, oval controls, close chrome.
 */

import type { JSX } from "react";
import type {
  CallLineCardViewModel,
  CallVideoMediaState,
  SessionViewMode,
} from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/AppIcon.js";
import { CallVideoSurface } from "./CallVideoSurface.js";
import { VideoFullscreenControlsBar } from "./VideoFullscreenControlsBar.js";
import styles from "./VideoFullscreenModal.module.css";

export type VideoFullscreenModalProps = Readonly<{
  open: boolean;
  callId: string;
  videoState: CallVideoMediaState;
  line: CallLineCardViewModel | null;
  onBindSurfaces: (
    callId: string,
    remoteVideoElement: HTMLVideoElement,
    localVideoElement: HTMLVideoElement,
  ) => void;
  onMute: (callId: string) => void;
  onUnmute: (callId: string) => void;
  onToggleCamera: (callId: string) => void;
  onToggleScreenShare: (callId: string) => void;
  onSetSessionView: (callId: string, sessionView: SessionViewMode) => void;
  onHangup: (callId: string) => void;
  onClose: (callId: string) => void;
}>;

/**
 * - Purpose: single fullscreen video overlay without shell chrome visibility.
 * - Inputs: active video call projections and control handlers.
 * - Outputs: modal markup or null when closed / not fullscreen.
 */
export function VideoFullscreenModal({
  open,
  callId,
  videoState,
  line,
  onBindSurfaces,
  onMute,
  onUnmute,
  onToggleCamera,
  onToggleScreenShare,
  onSetSessionView,
  onHangup,
  onClose,
}: VideoFullscreenModalProps): JSX.Element | null {
  const { t } = useI18n();

  if (!open || videoState.sessionView !== "fullscreen" || videoState.mediaMode !== "video") {
    return null;
  }

  return (
    <div
      className={styles.modal}
      data-testid="video-fullscreen-modal"
      data-call-id={callId}
      role="dialog"
      aria-modal="true"
      aria-label={t("call.video.fullscreenModalAria")}
    >
      <button
        type="button"
        className={styles.closeButton}
        data-testid={`video-fullscreen-close-${callId}`}
        aria-label={t("call.video.exitFullscreen")}
        onClick={() => {
          onClose(callId);
        }}
      >
        <AppIcon id="overlay.close" decorative />
      </button>
      <div className={styles.surface}>
        <CallVideoSurface
          callId={callId}
          videoState={videoState}
          onBindSurfaces={onBindSurfaces}
          pipMode="fullscreen"
        />
      </div>
      <VideoFullscreenControlsBar
        callId={callId}
        line={line}
        videoState={videoState}
        onMute={onMute}
        onUnmute={onUnmute}
        onToggleCamera={onToggleCamera}
        onToggleScreenShare={onToggleScreenShare}
        onSetSessionView={onSetSessionView}
        onHangup={onHangup}
      />
    </div>
  );
}
