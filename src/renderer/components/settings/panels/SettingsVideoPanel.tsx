import clsx from "clsx";
import type { ChangeEvent, JSX } from "react";
import {
  parseSessionViewMode,
  type SessionViewMode,
} from "@application/index.js";
import { useI18n, type TranslationKey } from "../../../i18n/index.js";
import { Button, Input, Select, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import {
  parsePreferredDeviceSelectValue,
  resolvePreferredDeviceSelectValue,
  type VideoSettingsDeviceOption,
} from "../../../hooks/useVideoSettingsPanel.js";
import styles from "./SettingsVideoPanel.module.css";

export type SettingsVideoPanelProps = Readonly<{
  preferredAudioInputDeviceId: string | null;
  preferredVideoInputDeviceId: string | null;
  defaultSessionView: SessionViewMode;
  autoFullscreenOnConference: boolean;
  conferenceNumberSubstring: string | null;
  enableLocalVideoAfterConnect: boolean;
  audioDevices: ReadonlyArray<VideoSettingsDeviceOption>;
  videoDevices: ReadonlyArray<VideoSettingsDeviceOption>;
  devicesLoading: boolean;
  devicesError: boolean;
  previewError: boolean;
  previewVideoRef: (element: HTMLVideoElement | null) => void;
  onPreferredAudioInputDeviceIdChange: (deviceId: string | null) => void;
  onPreferredVideoInputDeviceIdChange: (deviceId: string | null) => void;
  onDefaultSessionViewChange: (view: SessionViewMode) => void;
  onAutoFullscreenOnConferenceChange: (enabled: boolean) => void;
  onConferenceNumberSubstringChange: (value: string | null) => void;
  onEnableLocalVideoAfterConnectChange: (enabled: boolean) => void;
  onRefreshDevices: () => void;
}>;

const SESSION_VIEW_OPTIONS: ReadonlyArray<
  Readonly<{ value: SessionViewMode; label: TranslationKey }>
> = [
  { value: "expanded", label: "settings.video.defaultView.expanded" },
  { value: "hidden", label: "settings.video.defaultView.hidden" },
  { value: "fullscreen", label: "settings.video.defaultView.fullscreen" },
];

/**
 * - Purpose: configure preferred media devices and video session view prefs.
 * - Inputs: persisted settings, device options, preview ref, change callbacks.
 * - Outputs: accessible Settings Video form without facade or MediaStream state.
 */
export function SettingsVideoPanel({
  preferredAudioInputDeviceId,
  preferredVideoInputDeviceId,
  defaultSessionView,
  autoFullscreenOnConference,
  conferenceNumberSubstring,
  enableLocalVideoAfterConnect,
  audioDevices,
  videoDevices,
  devicesLoading,
  devicesError,
  previewError,
  previewVideoRef,
  onPreferredAudioInputDeviceIdChange,
  onPreferredVideoInputDeviceIdChange,
  onDefaultSessionViewChange,
  onAutoFullscreenOnConferenceChange,
  onConferenceNumberSubstringChange,
  onEnableLocalVideoAfterConnectChange,
  onRefreshDevices,
}: SettingsVideoPanelProps): JSX.Element {
  const { t } = useI18n();

  const handleAudioChange = (value: string): void => {
    onPreferredAudioInputDeviceIdChange(parsePreferredDeviceSelectValue(value));
  };

  const handleVideoChange = (value: string): void => {
    onPreferredVideoInputDeviceIdChange(parsePreferredDeviceSelectValue(value));
  };

  const handleSessionViewChange = (value: string): void => {
    const parsed = parseSessionViewMode(value);
    if (parsed === null) {
      return;
    }
    onDefaultSessionViewChange(parsed);
  };

  const handleConferenceSubstringChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const next = event.target.value.trim();
    onConferenceNumberSubstringChange(next.length > 0 ? next : null);
  };

  const sessionViewItems = SESSION_VIEW_OPTIONS.map((option) => ({
    value: option.value,
    label: t(option.label),
  }));

  return (
    <div className={formStyles.panelStack} data-testid="settings-video-panel">
      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>{t("settings.video.devicesLegend")}</legend>
        <p className={formStyles.blockHint}>{t("settings.video.description")}</p>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <label className={formStyles.fieldLabelGroup} htmlFor="settings-video-mic-select">
              <span className={formStyles.fieldLabel} id="settings-video-mic-select-label">
                {t("settings.video.micLabel")}
              </span>
              <span className={formStyles.fieldDescription}>
                {t("settings.video.micDescription")}
              </span>
            </label>
            <div className={styles.deviceSelectField}>
              <Select
                id="settings-video-mic-select"
                data-testid="settings-video-mic-select"
                aria-labelledby="settings-video-mic-select-label"
                items={audioDevices}
                value={resolvePreferredDeviceSelectValue(preferredAudioInputDeviceId)}
                disabled={devicesLoading || audioDevices.length === 0}
                onValueChange={handleAudioChange}
              />
            </div>
          </div>

          <div className={formStyles.settingBlock}>
            <label className={formStyles.fieldLabelGroup} htmlFor="settings-video-camera-select">
              <span className={formStyles.fieldLabel} id="settings-video-camera-select-label">
                {t("settings.video.cameraLabel")}
              </span>
              <span className={formStyles.fieldDescription}>
                {t("settings.video.cameraDescription")}
              </span>
            </label>
            <div className={styles.deviceSelectField}>
              <Select
                id="settings-video-camera-select"
                data-testid="settings-video-camera-select"
                aria-labelledby="settings-video-camera-select-label"
                items={videoDevices}
                value={resolvePreferredDeviceSelectValue(preferredVideoInputDeviceId)}
                disabled={devicesLoading || videoDevices.length === 0}
                onValueChange={handleVideoChange}
              />
            </div>
          </div>

          <div className={formStyles.settingBlock}>
            <p className={formStyles.fieldLabel}>{t("settings.video.previewLabel")}</p>
            <p className={formStyles.fieldDescription}>{t("settings.video.previewDescription")}</p>
            <div className={styles.previewFrame} data-testid="settings-video-preview-frame">
              <video
                ref={previewVideoRef}
                className={styles.previewVideo}
                data-testid="settings-video-preview"
                autoPlay
                playsInline
                muted
              />
              {previewError ? (
                <p className={styles.previewPlaceholder} data-testid="settings-video-preview-error">
                  {t("settings.video.previewError")}
                </p>
              ) : null}
            </div>
            {devicesError ? (
              <p className={formStyles.error} data-testid="settings-video-devices-error">
                {t("settings.video.devicesError")}
              </p>
            ) : null}
            <div className={clsx(formStyles.actionRow)}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                data-testid="settings-video-refresh-devices"
                onClick={onRefreshDevices}
              >
                {t("settings.video.refreshDevices")}
              </Button>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>{t("settings.video.viewLegend")}</legend>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <label
              className={formStyles.fieldLabelGroup}
              htmlFor="settings-video-default-view-select"
            >
              <span className={formStyles.fieldLabel} id="settings-video-default-view-label">
                {t("settings.video.defaultViewLabel")}
              </span>
              <span className={formStyles.fieldDescription}>
                {t("settings.video.defaultViewDescription")}
              </span>
            </label>
            <div className={styles.deviceSelectField}>
              <Select
                id="settings-video-default-view-select"
                data-testid="settings-video-default-view-select"
                aria-labelledby="settings-video-default-view-label"
                items={sessionViewItems}
                value={defaultSessionView}
                onValueChange={handleSessionViewChange}
              />
            </div>
          </div>

          <div className={formStyles.settingBlock}>
            <label
              className={formStyles.toggleRow}
              htmlFor="settings-video-enable-local-video-after-connect"
            >
              <span className={formStyles.toggleText}>
                <span className={formStyles.toggleLabel}>
                  {t("settings.video.enableLocalVideoAfterConnect.label")}
                </span>
                <span className={formStyles.toggleDescription}>
                  {t("settings.video.enableLocalVideoAfterConnect.description")}
                </span>
              </span>
              <Switch
                id="settings-video-enable-local-video-after-connect"
                checked={enableLocalVideoAfterConnect}
                data-testid="settings-video-enable-local-video-after-connect-toggle"
                onCheckedChange={onEnableLocalVideoAfterConnectChange}
              />
            </label>
          </div>

          <div className={formStyles.settingBlock}>
            <label
              className={formStyles.toggleRow}
              htmlFor="settings-video-auto-fullscreen"
            >
              <span className={formStyles.toggleText}>
                <span className={formStyles.toggleLabel}>
                  {t("settings.video.autoFullscreen.label")}
                </span>
                <span className={formStyles.toggleDescription}>
                  {t("settings.video.autoFullscreen.description")}
                </span>
              </span>
              <Switch
                id="settings-video-auto-fullscreen"
                checked={autoFullscreenOnConference}
                data-testid="settings-video-auto-fullscreen-toggle"
                onCheckedChange={onAutoFullscreenOnConferenceChange}
              />
            </label>
          </div>

          <div
            className={clsx(
              formStyles.settingBlock,
              !autoFullscreenOnConference && formStyles.settingBlockDisabled,
            )}
          >
            <label
              className={formStyles.fieldLabelGroup}
              htmlFor="settings-video-conference-substring"
            >
              <span className={formStyles.fieldLabel}>
                {t("settings.video.conferenceSubstring.label")}
              </span>
              <span className={formStyles.fieldDescription}>
                {t("settings.video.conferenceSubstring.description")}
              </span>
            </label>
            <div className={styles.conferenceField}>
              <Input
                id="settings-video-conference-substring"
                data-testid="settings-video-conference-substring"
                value={conferenceNumberSubstring ?? ""}
                disabled={!autoFullscreenOnConference}
                placeholder={t("settings.video.conferenceSubstring.placeholder")}
                onChange={handleConferenceSubstringChange}
              />
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
