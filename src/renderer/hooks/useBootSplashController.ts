import { useEffect, useLayoutEffect, useRef } from "react";
import {
  beginBootSplashExit,
  dismissBootSplash,
  setBootSplashMessage,
  updateBootSplashProgress,
} from "../helpers/bootSplashDom.js";
import { useBootstrapSplashProgress } from "./useBootstrapSplashProgress.js";

type BootstrapStatus = "loading" | "ready" | "error";

export type BootSplashController = Readonly<{
  /**
   * Ready shell may mount once settle is done — splash stays on top and fades
   * out over the shell (crossfade), then is removed from the DOM.
   */
  showReadyShell: boolean;
}>;

/**
 * Single-stage splash: drives `#boot-splash` for the whole bootstrap.
 * Does not mount a React loading splash (avoids HTML↔React handoff).
 */
export function useBootSplashController(
  status: BootstrapStatus,
  loadingMessage: string,
): BootSplashController {
  const { progress, showSplash } = useBootstrapSplashProgress(status);
  const exitStartedRef = useRef(false);

  useLayoutEffect(() => {
    if (status === "error") {
      dismissBootSplash();
      return;
    }

    setBootSplashMessage(loadingMessage);
    updateBootSplashProgress(progress);
  }, [status, progress, loadingMessage]);

  useEffect(() => {
    if (status !== "ready" || showSplash || exitStartedRef.current) {
      return;
    }

    exitStartedRef.current = true;
    let cancelled = false;

    void (async () => {
      await beginBootSplashExit();
      if (!cancelled) {
        dismissBootSplash();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, showSplash]);

  return {
    // Mount ready shell under the fading splash as soon as settle completes.
    showReadyShell: status === "ready" && !showSplash,
  };
}
