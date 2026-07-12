import { useEffect, useRef } from "react";
import { ShellWindowLayoutService } from "@application/services/platform/ShellWindowLayoutService.js";
import { PreloadShellWindowGateway } from "@adapters/platform/PreloadShellWindowGateway.js";

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type UseShellWindowLayoutInput = Readonly<{
  settingsOpen: boolean;
  videoFullscreen: boolean;
}>;

/**
 * - Purpose: sync Electron window bounds with settings and video fullscreen (F-016/F-027).
 * - Inputs: settings overlay open flag and video fullscreen session view flag.
 * - Outputs: invokes ShellWindowLayoutService when either flag changes.
 */
export function useShellWindowLayout(input: UseShellWindowLayoutInput): void {
  const { settingsOpen, videoFullscreen } = input;
  const previousRef = useRef<Readonly<{
    settingsOpen: boolean;
    videoFullscreen: boolean;
  }> | null>(null);
  const serviceRef = useRef<ShellWindowLayoutService | null>(null);

  useEffect(() => {
    if (serviceRef.current === null) {
      serviceRef.current = new ShellWindowLayoutService(new PreloadShellWindowGateway());
    }

    const previous = previousRef.current;
    if (previous === null) {
      previousRef.current = { settingsOpen, videoFullscreen };
      // Apply immediately when mounting already expanded (settings / video fullscreen).
      if (settingsOpen || videoFullscreen) {
        void serviceRef.current.syncLayout({
          settingsOpen,
          videoFullscreen,
          reducedMotion: prefersReducedMotion(),
        });
      }
      return;
    }

    if (
      previous.settingsOpen === settingsOpen &&
      previous.videoFullscreen === videoFullscreen
    ) {
      return;
    }

    previousRef.current = { settingsOpen, videoFullscreen };

    void serviceRef.current.syncLayout({
      settingsOpen,
      videoFullscreen,
      reducedMotion: prefersReducedMotion(),
    });
  }, [settingsOpen, videoFullscreen]);
}
