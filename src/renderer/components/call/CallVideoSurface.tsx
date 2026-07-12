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
  /** fullscreen: PiP with 24px edge inset matching control-bar `--space-lg`. */
  pipMode?: "default" | "fullscreen";
}>;

type PipOffset = Readonly<{ x: number; y: number }>;

const BIND_RETRY_MS = 400;
const BIND_RETRY_ATTEMPTS = 12;
/** Matches VideoFullscreenControlsBar `bottom: var(--space-lg)` (24px). */
const FULLSCREEN_PIP_EDGE_INSET_PX = 24;

function resolveFullscreenPipInsets(): Readonly<{ x: number; y: number }> {
  return {
    x: FULLSCREEN_PIP_EDGE_INSET_PX,
    y: FULLSCREEN_PIP_EDGE_INSET_PX,
  };
}

/**
 * - Purpose: present remote/local video with draggable/hideable local PiP.
 * - Inputs: call id, video media projection state, bind callback to Media adapter.
 * - Outputs: accessible video surface markup; no MediaStream in React state.
 */
export function CallVideoSurface({
  callId,
  videoState,
  onBindSurfaces,
  pipMode = "default",
}: CallVideoSurfaceProps): JSX.Element | null {
  const { t } = useI18n();
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remotePaneRef = useRef<HTMLDivElement | null>(null);
  const localPaneRef = useRef<HTMLDivElement | null>(null);
  const [localPipHidden, setLocalPipHidden] = useState(false);
  const [pipOffset, setPipOffset] = useState<PipOffset>({ x: 0, y: 0 });
  const livePipOffsetRef = useRef<PipOffset>({ x: 0, y: 0 });
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
    videoState.cameraAvailable,
  ]);

  useEffect(() => {
    setLocalPipHidden(false);
  }, [callId]);

  useEffect(() => {
    if (pipMode === "fullscreen") {
      setLocalPipHidden(false);
    }
  }, [pipMode, videoState.sessionView]);

  const applyPipOffset = useCallback((offset: PipOffset): void => {
    livePipOffsetRef.current = offset;
    setPipOffset(offset);
  }, []);

  useEffect(() => {
    const placeDefaultPip = (): void => {
      if (dragRef.current !== null) {
        return;
      }
      const pane = remotePaneRef.current;
      const pip = localPaneRef.current;
      if (pane === null || pip === null) {
        return;
      }
      if (pane.clientWidth < 8 || pane.clientHeight < 8 || pip.offsetWidth < 8) {
        return;
      }
      const insets =
        pipMode === "fullscreen"
          ? resolveFullscreenPipInsets()
          : { x: 8, y: 8 };
      applyPipOffset({
        x: Math.max(insets.x, pane.clientWidth - pip.offsetWidth - insets.x),
        y: Math.max(insets.y, pane.clientHeight - pip.offsetHeight - insets.y),
      });
    };

    const frame = window.requestAnimationFrame(placeDefaultPip);
    const pane = remotePaneRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" && pane !== null
        ? new ResizeObserver(() => {
            placeDefaultPip();
          })
        : null;
    if (observer !== null && pane !== null) {
      observer.observe(pane);
    }
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [applyPipOffset, callId, pipMode, videoState.sessionView, videoState.localVideoMuted]);

  const clampPipOffset = useCallback((next: PipOffset): PipOffset => {
    const pane = remotePaneRef.current;
    const pip = localPaneRef.current;
    if (pane === null || pip === null) {
      return next;
    }
    const insets =
      pipMode === "fullscreen"
        ? resolveFullscreenPipInsets()
        : { x: 0, y: 0 };
    const maxX = Math.max(insets.x, pane.clientWidth - pip.offsetWidth - insets.x);
    const maxY = Math.max(insets.y, pane.clientHeight - pip.offsetHeight - insets.y);
    return {
      x: Math.min(Math.max(insets.x, next.x), maxX),
      y: Math.min(Math.max(insets.y, next.y), maxY),
    };
  }, [pipMode]);

  const handlePipPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 || localPipHidden) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest("button") !== null) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const origin = livePipOffsetRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
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
    const next = clampPipOffset({
      x: drag.originX + dx,
      y: drag.originY + dy,
    });
    livePipOffsetRef.current = next;
    setPipOffset(next);
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
  const fullscreenPipSuppressed = pipMode === "fullscreen" && localMuted;
  const localPaneVisuallyHidden =
    fullscreenPipSuppressed || (pipMode === "default" && localPipHidden);
  const viewClass =
    videoState.sessionView === "fullscreen" || pipMode === "fullscreen"
      ? styles.fullscreen
      : styles.expanded;
  const localPaneClass =
    pipMode === "fullscreen"
      ? `${styles.localPane} ${styles.localPaneFullscreen}${
          fullscreenPipSuppressed ? ` ${styles.localPaneHidden}` : ""
        }`
      : `${styles.localPane}${localPipHidden ? ` ${styles.localPaneHidden}` : ""}`;

  return (
    <section
      className={`${styles.surface} ${viewClass}`}
      data-testid={`call-video-surface-${callId}`}
      data-session-view={videoState.sessionView}
      data-pip-mode={pipMode}
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
          className={localPaneClass}
          style={{ transform: `translate(${pipOffset.x}px, ${pipOffset.y}px)` }}
          data-muted={localMuted ? "true" : "false"}
          data-source={videoState.localVideoSource}
          data-testid={`call-video-local-pane-${callId}`}
          data-pip-visible={localPaneVisuallyHidden ? "false" : "true"}
          onPointerDown={localPaneVisuallyHidden ? undefined : handlePipPointerDown}
          onPointerMove={localPaneVisuallyHidden ? undefined : handlePipPointerMove}
          onPointerUp={localPaneVisuallyHidden ? undefined : handlePipPointerUp}
          onPointerCancel={localPaneVisuallyHidden ? undefined : handlePipPointerUp}
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
          {localMuted && pipMode === "default" ? (
            <p className={styles.localMutedLabel}>{t("call.video.cameraOff")}</p>
          ) : null}
          {pipMode === "default" ? (
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
          ) : null}
        </div>

        {pipMode === "default" && localPipHidden ? (
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
