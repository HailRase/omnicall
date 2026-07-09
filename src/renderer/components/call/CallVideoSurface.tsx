import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { CallVideoMediaState } from "@application/index.js";
import { shouldShowRemoteVideoSurface } from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/AppIcon.js";
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

type PipOffset = Readonly<{ x: number; y: number }>;

const BIND_RETRY_MS = 400;
const BIND_RETRY_ATTEMPTS = 12;

/**
 * - Purpose: present remote/local video with draggable/hideable local PiP.
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
  const remotePaneRef = useRef<HTMLDivElement | null>(null);
  const localPaneRef = useRef<HTMLDivElement | null>(null);
  const [localPipHidden, setLocalPipHidden] = useState(false);
  const [pipOffset, setPipOffset] = useState<PipOffset>({ x: 0, y: 0 });
  const dragRef = useRef<
    Readonly<{
      pointerId: number;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      moved: boolean;
    }> | null
  >(null);

  useEffect(() => {
    if (videoState.mediaMode !== "video") {
      return;
    }
    let cancelled = false;
    let attempts = 0;
    let timerId: number | undefined;

    const bind = (): void => {
      if (cancelled) {
        return;
      }
      const remote = remoteRef.current;
      const local = localRef.current;
      if (remote === null || local === null) {
        return;
      }
      onBindSurfaces(callId, remote, local);
      attempts += 1;
      const srcObject = remote.srcObject;
      const hasRemote =
        typeof MediaStream !== "undefined" &&
        srcObject instanceof MediaStream &&
        srcObject.getVideoTracks().length > 0;
      if (!hasRemote && attempts < BIND_RETRY_ATTEMPTS) {
        timerId = window.setTimeout(bind, BIND_RETRY_MS);
      }
    };

    bind();
    return () => {
      cancelled = true;
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, [
    callId,
    onBindSurfaces,
    videoState.mediaMode,
    videoState.localVideoMuted,
    videoState.localVideoSource,
    videoState.remoteVideoPresent,
    videoState.sessionView,
  ]);

  useEffect(() => {
    setLocalPipHidden(false);
  }, [callId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const pane = remotePaneRef.current;
      const pip = localPaneRef.current;
      if (pane === null || pip === null) {
        setPipOffset({ x: 0, y: 0 });
        return;
      }
      setPipOffset({
        x: Math.max(0, pane.clientWidth - pip.offsetWidth - 8),
        y: Math.max(0, pane.clientHeight - pip.offsetHeight - 8),
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [callId, videoState.sessionView]);

  const clampPipOffset = useCallback((next: PipOffset): PipOffset => {
    const pane = remotePaneRef.current;
    const pip = localPaneRef.current;
    if (pane === null || pip === null) {
      return next;
    }
    const maxX = Math.max(0, pane.clientWidth - pip.offsetWidth);
    const maxY = Math.max(0, pane.clientHeight - pip.offsetHeight);
    return {
      x: Math.min(Math.max(0, next.x), maxX),
      y: Math.min(Math.max(0, next.y), maxY),
    };
  }, []);

  const handlePipPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 || localPipHidden) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest("button") !== null) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pipOffset.x,
      originY: pipOffset.y,
      moved: false,
    };
  };

  const handlePipPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (drag === null || drag.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 3) {
      return;
    }
    dragRef.current = { ...drag, moved: true };
    setPipOffset(
      clampPipOffset({
        x: drag.originX + dx,
        y: drag.originY + dy,
      }),
    );
  };

  const handlePipPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (drag === null || drag.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (videoState.mediaMode !== "video") {
    return null;
  }

  const showRemote = shouldShowRemoteVideoSurface(videoState);
  const localMuted =
    videoState.localVideoMuted && videoState.localVideoSource !== "screen";
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
      <div ref={remotePaneRef} className={styles.remotePane}>
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
          <p
            className={styles.placeholder}
            data-testid={`call-video-remote-placeholder-${callId}`}
          >
            {t("call.video.remotePlaceholder")}
          </p>
        ) : null}

        <div
          ref={localPaneRef}
          className={`${styles.localPane} ${localPipHidden ? styles.localPaneHidden : ""}`}
          style={{ transform: `translate(${pipOffset.x}px, ${pipOffset.y}px)` }}
          data-muted={localMuted ? "true" : "false"}
          data-source={videoState.localVideoSource}
          data-testid={`call-video-local-pane-${callId}`}
          onPointerDown={handlePipPointerDown}
          onPointerMove={handlePipPointerMove}
          onPointerUp={handlePipPointerUp}
          onPointerCancel={handlePipPointerUp}
        >
          <video
            ref={localRef}
            className={styles.localVideo}
            data-testid={`call-video-local-${callId}`}
            autoPlay
            playsInline
            muted
            hidden={localMuted}
          />
          {localMuted ? (
            <p className={styles.localMutedLabel}>{t("call.video.cameraOff")}</p>
          ) : null}
          <button
            type="button"
            className={styles.localHideButton}
            data-testid={`call-video-local-hide-${callId}`}
            aria-label={t("call.video.hideLocalPreview")}
            onClick={(event) => {
              event.stopPropagation();
              setLocalPipHidden(true);
            }}
          >
            <AppIcon id="overlay.close" size={12} decorative />
          </button>
        </div>

        {localPipHidden ? (
          <button
            type="button"
            className={styles.localShowButton}
            data-testid={`call-video-local-show-${callId}`}
            aria-label={t("call.video.showLocalPreview")}
            onClick={() => {
              setLocalPipHidden(false);
            }}
          >
            <AppIcon id="form.password.show" size={16} decorative />
          </button>
        ) : null}
      </div>
    </section>
  );
}
