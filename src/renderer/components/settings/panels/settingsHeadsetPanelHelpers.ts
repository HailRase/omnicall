import type {
  HeadsetCapabilitiesInfo,
  HeadsetConnectionProjection,
} from "@application/projections/headset/headsetConnectionProjection.js";
import type { Translator } from "../../../i18n/index.js";

export type HeadsetGrantedDeviceOption = Readonly<{
  id: string;
  productName: string;
}>;

export const HEADSET_DEVICE_PICKER_VALUE = "__picker__";

/**
 * - Purpose: map headset projection to a localized status label.
 * - Inputs: connection projection and translator.
 * - Outputs: status string for the settings panel.
 */
export function resolveHeadsetConnectionStateLabel(
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
 * - Purpose: build localized capability summary for connected headset.
 * - Inputs: capabilities info and translator.
 * - Outputs: comma-separated feature list or null when empty.
 */
export function resolveHeadsetCapabilitiesSummary(
  capabilities: HeadsetCapabilitiesInfo,
  t: Translator,
): string | null {
  const parts: string[] = [];
  if (capabilities.supportsAnswer) {
    parts.push(t("settings.headset.capabilities.answer"));
  }
  if (capabilities.supportsReject) {
    parts.push(t("settings.headset.capabilities.reject"));
  }
  if (capabilities.supportsHangup) {
    parts.push(t("settings.headset.capabilities.hangup"));
  }
  if (capabilities.supportsMute) {
    parts.push(
      t("settings.headset.capabilities.mute", {
        mode: t(
          capabilities.muteInputMode === "pulse"
            ? "settings.headset.capabilities.muteMode.pulse"
            : "settings.headset.capabilities.muteMode.latch",
        ),
      }),
    );
  }
  if (capabilities.supportsHold) {
    parts.push(t("settings.headset.capabilities.hold"));
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.join(t("settings.headset.capabilities.separator"));
}

/**
 * - Purpose: resolve Select value from preferred/connected/granted devices.
 * - Inputs: preferred id, connected id, granted list.
 * - Outputs: device id or picker sentinel.
 */
export function resolveHeadsetDeviceSelectValue(
  preferredDeviceId: string | null,
  connectedDeviceId: string | null,
  grantedDevices: ReadonlyArray<HeadsetGrantedDeviceOption>,
): string {
  const connected =
    connectedDeviceId !== null &&
    grantedDevices.some((device) => device.id === connectedDeviceId)
      ? connectedDeviceId
      : null;
  if (connected !== null) {
    return connected;
  }
  if (
    preferredDeviceId !== null &&
    grantedDevices.some((device) => device.id === preferredDeviceId)
  ) {
    return preferredDeviceId;
  }
  if (grantedDevices[0] !== undefined) {
    return grantedDevices[0].id;
  }
  return HEADSET_DEVICE_PICKER_VALUE;
}
