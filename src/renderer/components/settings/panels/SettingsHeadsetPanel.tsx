import clsx from "clsx";
import type { JSX } from "react";
import type { HeadsetConnectionProjection } from "@application/projections/headset/headsetConnectionProjection.js";
import { useI18n, type Translator } from "../../../i18n/index.js";
import { Button, Switch } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";

export type SettingsHeadsetPanelProps = Readonly<{
  projection: HeadsetConnectionProjection;
  headsetEnabled: boolean;
  headsetAutoReconnect: boolean;
  onHeadsetEnabledChange: (enabled: boolean) => void;
  onHeadsetAutoReconnectChange: (enabled: boolean) => void;
  onConnectHeadset: () => void;
  onDisconnectHeadset: () => void;
}>;

function resolveConnectionStateLabel(
  projection: HeadsetConnectionProjection,
  t: Translator,
): string {
  if (!projection.isSupported) {
    return t("settings.headset.status.unsupported");
  }
  if (!projection.isEnabled) {
    return t("settings.headset.status.disabled");
  }
  switch (projection.connectionState) {
    case "connected":
      return t("settings.headset.status.connected");
    case "connecting":
      return t("settings.headset.status.connecting");
    case "error":
      return t("settings.headset.status.error");
    case "unsupported":
      return t("settings.headset.status.unsupported");
    default:
      return t("settings.headset.status.disconnected");
  }
}

/**
 * - Purpose: configure optional USB headset integration and connection controls.
 * - Inputs: headset settings, connection projection, connect/disconnect callbacks.
 * - Outputs: localized headset settings section without direct gateway access.
 */
export function SettingsHeadsetPanel({
  projection,
  headsetEnabled,
  headsetAutoReconnect,
  onHeadsetEnabledChange,
  onHeadsetAutoReconnectChange,
  onConnectHeadset,
  onDisconnectHeadset,
}: SettingsHeadsetPanelProps): JSX.Element {
  const { t } = useI18n();
  const canConnect =
    projection.isSupported && headsetEnabled && projection.connectionState !== "connected";
  const canDisconnect =
    projection.isSupported && headsetEnabled && projection.connectionState === "connected";

  return (
    <div className={formStyles.panelStack} data-testid="settings-headset-panel">
      <fieldset className={formStyles.sectionCard}>
        <legend className={formStyles.sectionTitle}>{t("settings.headset.title")}</legend>
        <p className={formStyles.blockHint}>{t("settings.headset.description")}</p>
        <div className={formStyles.settingsGroup}>
          <div className={formStyles.settingBlock}>
            <label className={formStyles.toggleRow} htmlFor="settings-headset-enabled">
              <span className={formStyles.toggleText}>
                <span className={formStyles.toggleLabel}>
                  {t("settings.headset.enabled.label")}
                </span>
                <span className={formStyles.toggleDescription}>
                  {t("settings.headset.enabled.description")}
                </span>
              </span>
              <Switch
                id="settings-headset-enabled"
                checked={headsetEnabled}
                disabled={!projection.isSupported}
                data-testid="settings-headset-enabled-toggle"
                onCheckedChange={onHeadsetEnabledChange}
              />
            </label>
          </div>

          <div className={formStyles.settingBlock}>
            <label className={formStyles.toggleRow} htmlFor="settings-headset-auto-reconnect">
              <span className={formStyles.toggleText}>
                <span className={formStyles.toggleLabel}>
                  {t("settings.headset.autoReconnect.label")}
                </span>
                <span className={formStyles.toggleDescription}>
                  {t("settings.headset.autoReconnect.description")}
                </span>
              </span>
              <Switch
                id="settings-headset-auto-reconnect"
                checked={headsetAutoReconnect}
                disabled={!headsetEnabled || !projection.isSupported}
                data-testid="settings-headset-auto-reconnect-toggle"
                onCheckedChange={onHeadsetAutoReconnectChange}
              />
            </label>
          </div>

          <div className={formStyles.settingBlock}>
            <p className={formStyles.toggleLabel}>{t("settings.headset.status.label")}</p>
            <p className={formStyles.fieldValue} data-testid="settings-headset-status">
              {resolveConnectionStateLabel(projection, t)}
            </p>
            {projection.deviceLabel !== null ? (
              <p className={formStyles.blockHint} data-testid="settings-headset-device-label">
                {t("settings.headset.deviceLabel", { name: projection.deviceLabel })}
              </p>
            ) : null}
          </div>

          <div className={clsx(formStyles.settingBlock, formStyles.actionRow)}>
            <Button
              type="button"
              variant="secondary"
              disabled={!canConnect}
              data-testid="settings-headset-connect"
              onClick={onConnectHeadset}
            >
              {t("settings.headset.connect")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!canDisconnect}
              data-testid="settings-headset-disconnect"
              onClick={onDisconnectHeadset}
            >
              {t("settings.headset.disconnect")}
            </Button>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
