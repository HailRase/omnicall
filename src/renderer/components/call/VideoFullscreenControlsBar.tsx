/**
 * - Purpose: oval translucent fullscreen-only session controls (F-027).
 * - Inputs: call line, video state, mute/cam/screen/view/hangup handlers.
 * - Outputs: bottom-centered control bar markup.
 */

import clsx from "clsx";
import type { JSX } from "react";
import type {
  CallLineCardViewModel,
  CallVideoMediaState,
  SessionViewMode,
} from "@application/index.js";
import {
  areCameraControlsEnabled,
  isScreenShareAllowed,
} from "@application/index.js";
import { useI18n } from "../../i18n/index.js";
import { AppIcon } from "../icons/AppIcon.js";
import type { IconSemanticId } from "../icons/iconCatalog.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu/index.js";
import styles from "./VideoFullscreenControlsBar.module.css";

export type VideoFullscreenControlsBarProps = Readonly<{
  callId: string;
  line: CallLineCardViewModel | null;
  videoState: CallVideoMediaState;
  onMute: (callId: string) => void;
  onUnmute: (callId: string) => void;
  onToggleCamera: (callId: string) => void;
  onToggleScreenShare: (callId: string) => void;
  onSetSessionView: (callId: string, sessionView: SessionViewMode) => void;
  onHangup: (callId: string) => void;
}>;

type ViewModeOption = Readonly<{
  value: SessionViewMode;
  labelKey:
    | "call.video.viewMode.expanded"
    | "call.video.viewMode.hidden"
    | "call.video.viewMode.fullscreen";
  iconId: IconSemanticId;
}>;

const VIEW_MODE_OPTIONS: ReadonlyArray<ViewModeOption> = [
  {
    value: "fullscreen",
    labelKey: "call.video.viewMode.fullscreen",
    iconId: "call.videoExpand",
  },
  {
    value: "expanded",
    labelKey: "call.video.viewMode.expanded",
    iconId: "call.videoCollapse",
  },
  {
    value: "hidden",
    labelKey: "call.video.viewMode.hidden",
    iconId: "call.videoHidden",
  },
];

/**
 * - Purpose: mic, camera, screen share, view mode, hangup only.
 * - Inputs: active line + video projection + callbacks.
 * - Outputs: accessible oval control bar.
 */
export function VideoFullscreenControlsBar({
  callId,
  line,
  videoState,
  onMute,
  onUnmute,
  onToggleCamera,
  onToggleScreenShare,
  onSetSessionView,
  onHangup,
}: VideoFullscreenControlsBarProps): JSX.Element {
  const { t } = useI18n();
  const muted = line?.muted === true;
  const cameraOff = videoState.localVideoMuted;
  const cameraEnabled = areCameraControlsEnabled(videoState);
  const screenShareEnabled = isScreenShareAllowed(videoState);
  const currentView: ViewModeOption =
    VIEW_MODE_OPTIONS.find((option) => option.value === videoState.sessionView) ?? {
      value: "fullscreen",
      labelKey: "call.video.viewMode.fullscreen",
      iconId: "call.videoExpand",
    };
  const selectableViewModes = VIEW_MODE_OPTIONS.filter(
    (option) => option.value !== videoState.sessionView,
  );

  return (
    <div className={styles.bar} data-testid="video-fullscreen-controls-bar" role="toolbar">
      <button
        type="button"
        className={clsx(styles.button, muted && styles.buttonOff)}
        data-testid={`fullscreen-control-mute-${callId}`}
        aria-label={muted ? t("icons.call.unmute") : t("icons.call.mute")}
        aria-pressed={muted}
        disabled={line === null}
        onClick={() => {
          if (line === null) {
            return;
          }
          if (muted) {
            onUnmute(callId);
          } else {
            onMute(callId);
          }
        }}
      >
        <AppIcon id={muted ? "call.mute" : "call.unmute"} decorative />
      </button>

      <button
        type="button"
        className={clsx(styles.button, cameraOff && styles.buttonOff)}
        data-testid={`fullscreen-control-camera-${callId}`}
        aria-label={
          cameraOff ? t("icons.call.cameraOn") : t("icons.call.cameraOff")
        }
        aria-pressed={!cameraOff}
        disabled={!cameraEnabled}
        onClick={() => {
          onToggleCamera(callId);
        }}
      >
        <AppIcon
          id={cameraOff ? "call.cameraOff" : "call.cameraOn"}
          decorative
        />
      </button>

      <button
        type="button"
        className={styles.button}
        data-testid={`fullscreen-control-screen-share-${callId}`}
        aria-label={
          videoState.localVideoSource === "screen"
            ? t("icons.call.screenShareStop")
            : t("icons.call.screenShare")
        }
        aria-pressed={videoState.localVideoSource === "screen"}
        disabled={!screenShareEnabled}
        onClick={() => {
          onToggleScreenShare(callId);
        }}
      >
        <AppIcon
          id={
            videoState.localVideoSource === "screen"
              ? "call.screenShareStop"
              : "call.screenShare"
          }
          decorative
        />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={styles.button}
            data-testid={`fullscreen-control-view-mode-${callId}`}
            aria-label={t(currentView.labelKey)}
          >
            <AppIcon id={currentView.iconId} decorative />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="top">
          {selectableViewModes.map((option) => (
            <DropdownMenuItem
              key={option.value}
              data-testid={`fullscreen-view-mode-${option.value}`}
              onSelect={() => {
                onSetSessionView(callId, option.value);
              }}
            >
              <AppIcon id={option.iconId} decorative />
              <span>{t(option.labelKey)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        className={`${styles.button} ${styles.hangup}`}
        data-testid={`fullscreen-control-hangup-${callId}`}
        aria-label={t("call.controls.hangupLineAria", {
          displayName: line?.displayName ?? callId,
        })}
        onClick={() => {
          onHangup(callId);
        }}
      >
        <AppIcon id="call.hangup" decorative />
      </button>
    </div>
  );
}
