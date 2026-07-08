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
}>;

/**
 * - Purpose: sync Electron window bounds with settings overlay open state (F-016).
 * - Inputs: settings overlay open flag.
 * - Outputs: invokes ShellWindowLayoutService when open state changes.
 */
export function useShellWindowLayout(input: UseShellWindowLayoutInput): void {
  const { settingsOpen } = input;
  const previousOpenRef = useRef<boolean | null>(null);
  const serviceRef = useRef<ShellWindowLayoutService | null>(null);

  useEffect(() => {
    if (serviceRef.current === null) {
      serviceRef.current = new ShellWindowLayoutService(new PreloadShellWindowGateway());
    }

    if (previousOpenRef.current === null) {
      previousOpenRef.current = settingsOpen;
      return;
    }

    if (previousOpenRef.current === settingsOpen) {
      return;
    }

    previousOpenRef.current = settingsOpen;

    void serviceRef.current.syncForSettingsOverlay({
      settingsOpen,
      reducedMotion: prefersReducedMotion(),
    });
  }, [settingsOpen]);
}
