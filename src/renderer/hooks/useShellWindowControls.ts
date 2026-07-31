import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PreloadAppLifecycleGateway } from "@adapters/platform/PreloadAppLifecycleGateway.js";
import { PreloadPlatformInfoGateway } from "@adapters/platform/PreloadPlatformInfoGateway.js";
import { isErr } from "@shared/result/index.js";
import type { PlatformVersionResponse } from "@shared/ipc/IpcChannels.js";

export type ShellWindowControlsViewModel = Readonly<{
  platform: PlatformVersionResponse["platform"];
  showNativeWindowControls: boolean;
  isShuttingDown: boolean;
  maximizeEnabled: boolean;
  isMaximized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onRestart: () => void;
  onToggleMaximize: () => void;
}>;

type UseShellWindowControlsInput = Readonly<{
  isShuttingDown: boolean;
  settingsOpen: boolean;
}>;

/**
 * - Purpose: bind custom shell window controls to preload lifecycle IPC (F-016).
 * - Inputs: shutdown flag and settings-open flag for work-area fill affordance.
 * - Outputs: platform-aware window control callbacks for presentational UI.
 */
export function useShellWindowControls(
  input: UseShellWindowControlsInput,
): ShellWindowControlsViewModel {
  const { isShuttingDown, settingsOpen } = input;
  const lifecycleGatewayRef = useRef(new PreloadAppLifecycleGateway());
  const platformGatewayRef = useRef(new PreloadPlatformInfoGateway());
  const [platform, setPlatform] = useState<PlatformVersionResponse["platform"]>("linux");
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    void (async () => {
      const result = await platformGatewayRef.current.getInstalledPlatformInfo();
      if (isErr(result)) {
        return;
      }
      setPlatform(result.value.platform);
    })();
  }, []);

  useEffect(() => {
    document.documentElement.dataset["shellPlatform"] = platform;

    return () => {
      delete document.documentElement.dataset["shellPlatform"];
    };
  }, [platform]);

  useEffect(() => {
    const gateway = lifecycleGatewayRef.current;
    const unsubscribe = gateway.onWindowMaximizedChanged(setIsMaximized);

    void (async () => {
      const result = await gateway.getWindowMaximized();
      if (result.ok) {
        setIsMaximized(result.maximized);
      }
    })();

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!settingsOpen) {
      setIsMaximized(false);
    }
  }, [settingsOpen]);

  const showNativeWindowControls = true;
  const maximizeEnabled = settingsOpen;

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

  const onToggleMaximize = useCallback((): void => {
    if (isShuttingDown || !settingsOpen) {
      return;
    }
    void lifecycleGatewayRef.current.toggleMaximizeWindow();
  }, [isShuttingDown, settingsOpen]);

  return useMemo(
    () => ({
      platform,
      showNativeWindowControls,
      isShuttingDown,
      maximizeEnabled,
      isMaximized,
      onMinimize,
      onClose,
      onRestart,
      onToggleMaximize,
    }),
    [
      isMaximized,
      isShuttingDown,
      maximizeEnabled,
      onClose,
      onMinimize,
      onRestart,
      onToggleMaximize,
      platform,
      showNativeWindowControls,
    ],
  );
}
