import { useEffect, useRef, type JSX } from "react";
import type { CallVideoMediaState } from "@application/index.js";
import {
  shouldShowRemoteVideoSurface,
} from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import styles from "./CallVideoSurface.module.css";

export type CallVideoSurfaceProps = Readonly<{
  callId: string;
  videoState: CallVideoMediaState;
  onBindSurfaces: (
    callId: string,
    remoteVideoElement: HTMLVideoElement,
    localVideoElement: HTMLVideoElement,
  ) => void;
}>;

/**
 * - Purpose: present remote/local video elements for a video-mode call.
 * - Inputs: call id, video media projection state, bind callback to Media adapter.
 * - Outputs: accessible video surface markup; no MediaStream in React state.
 */
export function CallVideoSurface({
  callId,
  videoState,
  onBindSurfaces,
}: CallVideoSurfaceProps): JSX.Element | null {
  const { t } = useI18n();
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const localRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoState.mediaMode !== "video") {
      return;
    }
    const remote = remoteRef.current;
    const local = localRef.current;
    if (remote === null || local === null) {
      return;
    }
    onBindSurfaces(callId, remote, local);
  }, [
    callId,
    onBindSurfaces,
    videoState.mediaMode,
    videoState.localVideoMuted,
    videoState.localVideoSource,
    videoState.remoteVideoPresent,
  ]);

  if (videoState.mediaMode !== "video") {
    return null;
  }

  const showRemote = shouldShowRemoteVideoSurface(videoState);
  const viewClass =
    videoState.sessionView === "fullscreen"
      ? styles.fullscreen
      : videoState.sessionView === "expanded"
        ? styles.expanded
        : styles.compact;

  return (
    <section
      className={`${styles.surface} ${viewClass}`}
      data-testid={`call-video-surface-${callId}`}
      data-session-view={videoState.sessionView}
      aria-label={t("call.video.surfaceAria")}
    >
      <div className={styles.remotePane}>
        <video
          ref={remoteRef}
          className={styles.remoteVideo}
          data-testid={`call-video-remote-${callId}`}
          autoPlay
          playsInline
          muted={false}
          hidden={!showRemote}
        />
        {!showRemote ? (
          <p className={styles.placeholder} data-testid={`call-video-remote-placeholder-${callId}`}>
            {t("call.video.remotePlaceholder")}
          </p>
        ) : null}
      </div>
      <div
        className={styles.localPane}
        data-muted={videoState.localVideoMuted ? "true" : "false"}
        data-source={videoState.localVideoSource}
      >
        <video
          ref={localRef}
          className={styles.localVideo}
          data-testid={`call-video-local-${callId}`}
          autoPlay
          playsInline
          muted
          hidden={videoState.localVideoMuted && videoState.localVideoSource !== "screen"}
        />
        {videoState.localVideoMuted && videoState.localVideoSource !== "screen" ? (
          <p className={styles.localMutedLabel}>{t("call.video.cameraOff")}</p>
        ) : null}
      </div>
    </section>
  );
}
