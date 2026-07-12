import clsx from "clsx";
import { useEffect, useMemo, useState, type JSX } from "react";
import type { HeadsetConnectionProjection } from "@application/projections/headset/headsetConnectionProjection.js";
import { useI18n } from "../../../i18n/index.js";
import { Button, Select, Switch, type SelectItemOption } from "../../ui/index.js";
import formStyles from "../SettingsForm.module.css";
import {
  HEADSET_DEVICE_PICKER_VALUE,
  resolveHeadsetCapabilitiesSummary,
  resolveHeadsetConnectionStateLabel,
  resolveHeadsetDeviceSelectValue,
  resolveHeadsetPrimaryConnectLabel,
  type HeadsetGrantedDeviceOption,
} from "./settingsHeadsetPanelHelpers.js";

export type { HeadsetGrantedDeviceOption };

export type SettingsHeadsetPanelProps = Readonly<{
  projection: HeadsetConnectionProjection;
  headsetEnabled: boolean;
  headsetAutoReconnect: boolean;
  preferredDeviceId: string | null;
  grantedDevices: ReadonlyArray<HeadsetGrantedDeviceOption>;
  onHeadsetEnabledChange: (enabled: boolean) => void;
  onHeadsetAutoReconnectChange: (enabled: boolean) => void;
  onConnectHeadset: (deviceId: string | null) => void;
  onDisconnectHeadset: () => void;
}>;

/**
 * - Purpose: headset settings — enable first, guided connect, compact status.
 * - Inputs: connection projection, settings flags, granted devices, connect callbacks.
 * - Outputs: localized headset panel without gateway or SIP access.
 */
export function SettingsHeadsetPanel({
  projection,
  headsetEnabled,
  headsetAutoReconnect,
  preferredDeviceId,
  grantedDevices,
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
  const showEmptyGrantHint =
    projection.isSupported && headsetEnabled && grantedDevices.length === 0;
  const showAutoReconnectHint =
    projection.isSupported &&
    headsetEnabled &&
    headsetAutoReconnect &&
    projection.connectionState === "disconnected" &&
    grantedDevices.length > 0;

  const [selectedDeviceId, setSelectedDeviceId] = useState(() =>
    resolveHeadsetDeviceSelectValue(preferredDeviceId, projection.deviceId, grantedDevices),
  );

  useEffect(() => {
    setSelectedDeviceId(
      resolveHeadsetDeviceSelectValue(preferredDeviceId, projection.deviceId, grantedDevices),
    );
  }, [preferredDeviceId, projection.deviceId, grantedDevices]);

  const selectItems = useMemo((): readonly SelectItemOption[] => {
    const grantedItems: SelectItemOption[] = grantedDevices.map((device) => ({
      value: device.id,
      label: device.productName,
    }));
    return [
      ...grantedItems,
      { value: HEADSET_DEVICE_PICKER_VALUE, label: t("settings.headset.device.add") },
    ];
  }, [grantedDevices, t]);

  const selectedDeviceName = useMemo((): string | null => {
    if (selectedDeviceId === HEADSET_DEVICE_PICKER_VALUE) {
      return null;
    }
    return grantedDevices.find((device) => device.id === selectedDeviceId)?.productName ?? null;
  }, [grantedDevices, selectedDeviceId]);

  const connectLabel = useMemo(
    (): string =>
      resolveHeadsetPrimaryConnectLabel(selectedDeviceName, grantedDevices.length, t),
    [grantedDevices.length, selectedDeviceName, t],
  );

  const capabilitiesSummary = useMemo((): string | null => {
    if (projection.connectionState !== "connected" || projection.capabilities === null) {
      return null;
    }
    return resolveHeadsetCapabilitiesSummary(projection.capabilities, t);
  }, [projection.capabilities, projection.connectionState, t]);

  function handleConnect(): void {
    if (selectedDeviceId === HEADSET_DEVICE_PICKER_VALUE) {
      onConnectHeadset(null);
      return;
    }
    onConnectHeadset(selectedDeviceId);
  }

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
                <span className={formStyles.blockHint}>
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
                <span className={formStyles.blockHint}>
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
              {resolveHeadsetConnectionStateLabel(projection, t)}
            </p>
            {projection.deviceLabel !== null ? (
              <p className={formStyles.blockHint} data-testid="settings-headset-device-label">
                {t("settings.headset.deviceLabel", { name: projection.deviceLabel })}
              </p>
            ) : null}
            {capabilitiesSummary !== null ? (
              <p
                className={formStyles.blockHint}
                data-testid="settings-headset-capabilities"
              >
                {t("settings.headset.capabilities.label", { summary: capabilitiesSummary })}
              </p>
            ) : null}
            {showEmptyGrantHint ? (
              <p className={formStyles.blockHint} data-testid="settings-headset-empty-hint">
                {t("settings.headset.emptyState.hint")}
              </p>
            ) : null}
            {showAutoReconnectHint ? (
              <p className={formStyles.blockHint} data-testid="settings-headset-reconnect-hint">
                {t("settings.headset.autoReconnect.pendingHint")}
              </p>
            ) : null}
            {!headsetEnabled && projection.isSupported ? (
              <p className={formStyles.blockHint} data-testid="settings-headset-enable-first-hint">
                {t("settings.headset.connectDisabled.enableFirst")}
              </p>
            ) : null}
            {headsetEnabled && projection.isSupported ? (
              <>
                {grantedDevices.length > 1 ? (
                  <div className={formStyles.languageSelectField}>
                    <Select
                      size="sm"
                      items={selectItems}
                      value={selectedDeviceId}
                      disabled={!canConnect}
                      placeholder={t("settings.headset.device.placeholder")}
                      aria-label={t("settings.headset.device.selectLabel")}
                      data-testid="settings-headset-device-select"
                      onValueChange={setSelectedDeviceId}
                    />
                  </div>
                ) : null}
                <div className={clsx(formStyles.actionRow)}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!canConnect}
                    data-testid="settings-headset-connect"
                    onClick={handleConnect}
                  >
                    {connectLabel}
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
              </>
            ) : null}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
