import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { PreloadAppLifecycleGateway } from "@adapters/platform/PreloadAppLifecycleGateway.js";
import { isErr } from "@shared/result/index.js";
import type { AppShutdownPayload } from "@shared/ipc/AppShutdownContract.js";

type UseAppShutdownInput = Readonly<{
  facade: AccountBootstrapFacade | null;
}>;

export type AppShutdownShellState = Readonly<{
  isShuttingDown: boolean;
  shutdownProgressKey: "shell.shutdown.quitting" | "shell.shutdown.restarting" | null;
  shutdownErrorKey: "shell.shutdown.failed" | null;
}>;

type UseAppShutdownResult = AppShutdownShellState;

/**
 * - Purpose: listen for Electron shutdown IPC and run cleanup Use Case (LF-079).
 * - Inputs: account bootstrap facade (nullable during bootstrap).
 * - Outputs: ordered shutdown cleanup, explicit cancel/reset on failure, safe ack when facade is absent.
 */
export function useAppShutdown(input: UseAppShutdownInput): UseAppShutdownResult {
  const { facade } = input;
  const lifecycleGatewayRef = useRef(new PreloadAppLifecycleGateway());
  const facadeRef = useRef<AccountBootstrapFacade | null>(facade);
  const cleanupInFlightRef = useRef(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [shutdownProgressKey, setShutdownProgressKey] =
    useState<AppShutdownShellState["shutdownProgressKey"]>(null);
  const [shutdownErrorKey, setShutdownErrorKey] =
    useState<AppShutdownShellState["shutdownErrorKey"]>(null);

  useEffect(() => {
    facadeRef.current = facade;
  }, [facade]);

  const runShutdownCleanup = useCallback(
    async (payload: AppShutdownPayload): Promise<void> => {
      if (cleanupInFlightRef.current) {
        return;
      }

      cleanupInFlightRef.current = true;
      setIsShuttingDown(true);
      setShutdownProgressKey(
        payload.action === "restart" ? "shell.shutdown.restarting" : "shell.shutdown.quitting",
      );
      setShutdownErrorKey(null);

      const activeFacade = facadeRef.current;
      const cleanupSkipped = activeFacade === null;

      if (!cleanupSkipped) {
        const result = await activeFacade.shutdownCleanup.execute({
          source: payload.source,
          correlationId: payload.correlationId,
        });

        if (isErr(result)) {
          await lifecycleGatewayRef.current.cancelShutdown(
            payload.correlationId,
            payload.action,
            "cleanup_failed",
          );
          cleanupInFlightRef.current = false;
          setIsShuttingDown(false);
          setShutdownProgressKey(null);
          setShutdownErrorKey("shell.shutdown.failed");
          return;
        }
      }

      const ack = await lifecycleGatewayRef.current.acknowledgeShutdown(
        payload.correlationId,
        payload.action,
        cleanupSkipped,
      );

      cleanupInFlightRef.current = false;

      if (!ack.ok) {
        const cancelReason =
          ack.reason === "preload_unavailable" ? "cleanup_preload_unavailable" : "cleanup_ack_failed";
        await lifecycleGatewayRef.current.cancelShutdown(
          payload.correlationId,
          payload.action,
          cancelReason,
        );
        setIsShuttingDown(false);
        setShutdownProgressKey(null);
        setShutdownErrorKey("shell.shutdown.failed");
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = lifecycleGatewayRef.current.onBeforeClose((payload) => {
      void runShutdownCleanup(payload);
    });

    return unsubscribe;
  }, [runShutdownCleanup]);

  return {
    isShuttingDown,
    shutdownProgressKey,
    shutdownErrorKey,
  };
}
