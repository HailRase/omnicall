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
  isPinned: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onRestart: () => void;
  onToggleMaximize: () => void;
  onTogglePin: () => void;
}>;

type UseShellWindowControlsInput = Readonly<{
  isShuttingDown: boolean;
  settingsOpen: boolean;
  /** Persist pin after a successful native toggle (UserSettings.windowAlwaysOnTop). */
  onPinnedPersist?: (pinned: boolean) => void;
}>;

/**
 * - Purpose: bind custom shell window controls to preload lifecycle IPC (F-016).
 * - Inputs: shutdown flag, settings-open flag, optional pin persist callback.
 * - Outputs: platform-aware window control callbacks for presentational UI.
 */
export function useShellWindowControls(
  input: UseShellWindowControlsInput,
): ShellWindowControlsViewModel {
  const { isShuttingDown, settingsOpen, onPinnedPersist } = input;
  const lifecycleGatewayRef = useRef(new PreloadAppLifecycleGateway());
  const platformGatewayRef = useRef(new PreloadPlatformInfoGateway());
  const onPinnedPersistRef = useRef(onPinnedPersist);
  onPinnedPersistRef.current = onPinnedPersist;
  const [platform, setPlatform] = useState<PlatformVersionResponse["platform"]>("linux");
  const [isMaximized, setIsMaximized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

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
    const gateway = lifecycleGatewayRef.current;
    const unsubscribe = gateway.onWindowAlwaysOnTopChanged(setIsPinned);

    void (async () => {
      const result = await gateway.getWindowAlwaysOnTop();
      if (result.ok) {
        setIsPinned(result.alwaysOnTop);
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

  const onTogglePin = useCallback((): void => {
    if (isShuttingDown) {
      return;
    }
    void (async () => {
      const result = await lifecycleGatewayRef.current.toggleWindowAlwaysOnTop();
      if (!result.ok) {
        return;
      }
      setIsPinned(result.alwaysOnTop);
      onPinnedPersistRef.current?.(result.alwaysOnTop);
    })();
  }, [isShuttingDown]);

  return useMemo(
    () => ({
      platform,
      showNativeWindowControls,
      isShuttingDown,
      maximizeEnabled,
      isMaximized,
      isPinned,
      onMinimize,
      onClose,
      onRestart,
      onToggleMaximize,
      onTogglePin,
    }),
    [
      isMaximized,
      isPinned,
      isShuttingDown,
      maximizeEnabled,
      onClose,
      onMinimize,
      onRestart,
      onToggleMaximize,
      onTogglePin,
      platform,
      showNativeWindowControls,
    ],
  );
}
