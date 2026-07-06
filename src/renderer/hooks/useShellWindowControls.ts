import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PreloadAppLifecycleGateway } from "@adapters/platform/PreloadAppLifecycleGateway.js";
import { PreloadPlatformInfoGateway } from "@adapters/platform/PreloadPlatformInfoGateway.js";
import { isErr } from "@shared/result/index.js";
import type { PlatformVersionResponse } from "@shared/ipc/IpcChannels.js";

export type ShellWindowControlsViewModel = Readonly<{
  platform: PlatformVersionResponse["platform"];
  showNativeWindowControls: boolean;
  isShuttingDown: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onRestart: () => void;
}>;

type UseShellWindowControlsInput = Readonly<{
  isShuttingDown: boolean;
}>;

/**
 * - Purpose: bind custom shell window controls to preload lifecycle IPC (F-016).
 * - Inputs: shutdown-in-progress flag from app shutdown hook.
 * - Outputs: platform-aware window control callbacks for presentational UI.
 */
export function useShellWindowControls(
  input: UseShellWindowControlsInput,
): ShellWindowControlsViewModel {
  const { isShuttingDown } = input;
  const lifecycleGatewayRef = useRef(new PreloadAppLifecycleGateway());
  const platformGatewayRef = useRef(new PreloadPlatformInfoGateway());
  const [platform, setPlatform] = useState<PlatformVersionResponse["platform"]>("linux");

  useEffect(() => {
    void (async () => {
      const result = await platformGatewayRef.current.getInstalledPlatformInfo();
      if (isErr(result)) {
        return;
      }
      setPlatform(result.value.platform);
    })();
  }, []);

  const showNativeWindowControls = platform === "win32" || platform === "linux";

  const onMinimize = useCallback((): void => {
    if (isShuttingDown) {
      return;
    }
    void lifecycleGatewayRef.current.minimizeWindow();
  }, [isShuttingDown]);

  const onClose = useCallback((): void => {
    if (isShuttingDown) {
      return;
    }
    void lifecycleGatewayRef.current.requestClose();
  }, [isShuttingDown]);

  const onRestart = useCallback((): void => {
    if (isShuttingDown) {
      return;
    }
    void lifecycleGatewayRef.current.requestRestart();
  }, [isShuttingDown]);

  return useMemo(
    () => ({
      platform,
      showNativeWindowControls,
      isShuttingDown,
      onMinimize,
      onClose,
      onRestart,
    }),
    [isShuttingDown, onClose, onMinimize, onRestart, platform, showNativeWindowControls],
  );
}
