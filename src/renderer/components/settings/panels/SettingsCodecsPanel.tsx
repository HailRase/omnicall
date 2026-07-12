import type { JSX } from "react";
import {
  isAudioCodecToggleDisabled,
  isVideoCodecToggleDisabled,
  type AudioCodecId,
  type CodecPreferenceMutationMessageKey,
  type CodecPreferences,
  type VideoCodecId,
} from "@application/index.js";
import { useI18n, type TranslationKey } from "../../../i18n/index.js";
import formStyles from "../SettingsForm.module.css";
import { CodecPreferencesSortableList } from "./CodecPreferencesSortableList.js";
import styles from "./SettingsCodecsPanel.module.css";

const AUDIO_CODEC_LABEL_KEYS: Readonly<Record<AudioCodecId, TranslationKey>> = {
  opus: "settings.codecs.audio.opus",
  pcmu: "settings.codecs.audio.pcmu",
  pcma: "settings.codecs.audio.pcma",
  g722: "settings.codecs.audio.g722",
  "telephone-event": "settings.codecs.audio.telephoneEvent",
};

const VIDEO_CODEC_LABEL_KEYS: Readonly<Record<VideoCodecId, TranslationKey>> = {
  vp8: "settings.codecs.video.vp8",
  vp9: "settings.codecs.video.vp9",
  h264: "settings.codecs.video.h264",
  av1: "settings.codecs.video.av1",
};

export type SettingsCodecsPanelProps = Readonly<{
  codecPreferences: CodecPreferences;
  onAudioCodecEnabledChange: (codecId: AudioCodecId, enabled: boolean) => void;
  onVideoCodecEnabledChange: (codecId: VideoCodecId, enabled: boolean) => void;
  onAudioCodecReorder: (fromIndex: number, toIndex: number) => void;
  onVideoCodecReorder: (fromIndex: number, toIndex: number) => void;
  mutationErrorKey: CodecPreferenceMutationMessageKey | null;
}>;

/**
 * - Purpose: present audio/video codec order and enablement settings.
 * - Inputs: codec preferences snapshot and toggle/reorder callbacks.
 * - Outputs: two-column drag-drop panel without facade or domain mutation logic.
 */
export function SettingsCodecsPanel({
  codecPreferences,
  onAudioCodecEnabledChange,
  onVideoCodecEnabledChange,
  onAudioCodecReorder,
  onVideoCodecReorder,
  mutationErrorKey,
}: SettingsCodecsPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <div className={formStyles.panelStack} data-testid="settings-codecs-panel">
      <p className={formStyles.fieldDescription}>{t("settings.codecs.sessionHint")}</p>
      {mutationErrorKey !== null ? (
        <p className={formStyles.error} role="alert" data-testid="settings-codecs-error">
          {t(mutationErrorKey)}
        </p>
      ) : null}
      <div className={styles.columns}>
        <section className={styles.column} aria-labelledby="settings-codecs-audio-title">
          <h4 className={styles.columnTitle} id="settings-codecs-audio-title">
            {t("settings.codecs.audio.legend")}
          </h4>
          <p className={styles.columnHint}>{t("settings.codecs.audio.hint")}</p>
          <div className={styles.listShell}>
            <CodecPreferencesSortableList
              listId="settings-codecs-audio"
              rows={codecPreferences.audio}
              resolveLabelKey={(codecId) =>
                AUDIO_CODEC_LABEL_KEYS[codecId as AudioCodecId] ?? "settings.codecs.errors.unknownAudioCodec"
              }
              isToggleDisabled={(codecId) =>
                isAudioCodecToggleDisabled(codecPreferences, codecId as AudioCodecId)
              }
              onToggle={(codecId, enabled) => {
                onAudioCodecEnabledChange(codecId as AudioCodecId, enabled);
              }}
              onReorder={onAudioCodecReorder}
            />
          </div>
        </section>
        <section className={styles.column} aria-labelledby="settings-codecs-video-title">
          <h4 className={styles.columnTitle} id="settings-codecs-video-title">
            {t("settings.codecs.video.legend")}
          </h4>
          <p className={styles.columnHint}>{t("settings.codecs.video.hint")}</p>
          <div className={styles.listShell}>
            <CodecPreferencesSortableList
              listId="settings-codecs-video"
              rows={codecPreferences.video}
              resolveLabelKey={(codecId) =>
                VIDEO_CODEC_LABEL_KEYS[codecId as VideoCodecId] ?? "settings.codecs.errors.unknownVideoCodec"
              }
              isToggleDisabled={(codecId) =>
                isVideoCodecToggleDisabled(codecPreferences, codecId as VideoCodecId)
              }
              onToggle={(codecId, enabled) => {
                onVideoCodecEnabledChange(codecId as VideoCodecId, enabled);
              }}
              onReorder={onVideoCodecReorder}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
