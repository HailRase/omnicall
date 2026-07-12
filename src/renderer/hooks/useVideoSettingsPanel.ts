import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { LocalMediaStreamHandle, MediaInputDeviceInfo } from "@application/index.js";

export const SYSTEM_DEFAULT_DEVICE_VALUE = "__system_default__";

export type VideoSettingsDeviceOption = Readonly<{
  value: string;
  label: string;
}>;

export type UseVideoSettingsPanelResult = Readonly<{
  audioDevices: ReadonlyArray<VideoSettingsDeviceOption>;
  videoDevices: ReadonlyArray<VideoSettingsDeviceOption>;
  devicesLoading: boolean;
  devicesError: boolean;
  previewError: boolean;
  previewVideoRef: (element: HTMLVideoElement | null) => void;
  refreshDevices: () => void;
}>;

type UseVideoSettingsPanelInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  preferredVideoInputDeviceId: string | null;
  sectionActive: boolean;
}>;

function toSelectValue(deviceId: string | null): string {
  return deviceId ?? SYSTEM_DEFAULT_DEVICE_VALUE;
}

function mapDevices(
  devices: ReadonlyArray<MediaInputDeviceInfo>,
  kind: MediaInputDeviceInfo["kind"],
  systemDefaultLabel: string,
): ReadonlyArray<VideoSettingsDeviceOption> {
  const options: VideoSettingsDeviceOption[] = [
    { value: SYSTEM_DEFAULT_DEVICE_VALUE, label: systemDefaultLabel },
  ];
  for (const device of devices) {
    if (device.kind !== kind || device.deviceId.length === 0) {
      continue;
    }
    options.push({ value: device.deviceId, label: device.label });
  }
  return options;
}

/**
 * - Purpose: enumerate media devices and bind camera preview for Settings Video.
 * - Inputs: facade, preferred camera id, section active flag, system-default label.
 * - Outputs: device options, preview ref callback, refresh/error flags; no MediaStream in state.
 */
export function useVideoSettingsPanel(
  input: UseVideoSettingsPanelInput,
  systemDefaultLabel: string,
): UseVideoSettingsPanelResult {
  const { facade, preferredVideoInputDeviceId, sectionActive } = input;
  const [devices, setDevices] = useState<ReadonlyArray<MediaInputDeviceInfo>>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const previewHandleRef = useRef<LocalMediaStreamHandle | null>(null);
  const previewElementRef = useRef<HTMLVideoElement | null>(null);
  const previewGenerationRef = useRef(0);

  const stopPreview = useCallback(async (): Promise<void> => {
    const handle = previewHandleRef.current;
    previewHandleRef.current = null;
    if (previewElementRef.current !== null) {
      previewElementRef.current.srcObject = null;
    }
    if (facade === null || handle === null) {
      return;
    }
    await facade.stopCameraPreview(handle);
  }, [facade]);

  const startPreview = useCallback(async (): Promise<void> => {
    if (facade === null || !sectionActive) {
      return;
    }
    const generation = previewGenerationRef.current + 1;
    previewGenerationRef.current = generation;
    await stopPreview();
    setPreviewError(false);
    const result = await facade.startCameraPreview(
      preferredVideoInputDeviceId ?? undefined,
    );
    if (generation !== previewGenerationRef.current) {
      if (result.ok) {
        await facade.stopCameraPreview(result.value.handle);
      }
      return;
    }
    if (!result.ok) {
      setPreviewError(true);
      return;
    }
    previewHandleRef.current = result.value.handle;
    const element = previewElementRef.current;
    if (element !== null) {
      const bindResult = facade.bindCameraPreviewElement(result.value.handle, element);
      if (!bindResult.ok) {
        setPreviewError(true);
      }
    }
  }, [facade, preferredVideoInputDeviceId, sectionActive, stopPreview]);

  const refreshDevices = useCallback((): void => {
    if (facade === null || !sectionActive) {
      return;
    }
    setDevicesLoading(true);
    setDevicesError(false);
    void facade.listMediaInputDevices().then((result) => {
      setDevicesLoading(false);
      if (!result.ok) {
        setDevicesError(true);
        setDevices([]);
        return;
      }
      setDevices(result.value);
    });
  }, [facade, sectionActive]);

  useEffect(() => {
    if (!sectionActive) {
      void stopPreview();
      return;
    }
    refreshDevices();
    void startPreview();
    return () => {
      previewGenerationRef.current += 1;
      void stopPreview();
    };
  }, [refreshDevices, sectionActive, startPreview, stopPreview]);

  const previewVideoRef = useCallback(
    (element: HTMLVideoElement | null): void => {
      previewElementRef.current = element;
      const handle = previewHandleRef.current;
      if (element === null || facade === null || handle === null) {
        return;
      }
      const bindResult = facade.bindCameraPreviewElement(handle, element);
      if (!bindResult.ok) {
        setPreviewError(true);
      }
    },
    [facade],
  );

  return {
    audioDevices: mapDevices(devices, "audioinput", systemDefaultLabel),
    videoDevices: mapDevices(devices, "videoinput", systemDefaultLabel),
    devicesLoading,
    devicesError,
    previewError,
    previewVideoRef,
    refreshDevices,
  };
}

export function resolvePreferredDeviceSelectValue(deviceId: string | null): string {
  return toSelectValue(deviceId);
}

export function parsePreferredDeviceSelectValue(value: string): string | null {
  return value === SYSTEM_DEFAULT_DEVICE_VALUE ? null : value;
}
