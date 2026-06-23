import { useEffect } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { isErr } from "@shared/result/index.js";

type UseAppShutdownInput = Readonly<{
  facade: AccountBootstrapFacade | null;
}>;

/**
 * - Purpose: listen for Electron shutdown IPC and run cleanup Use Case (LF-079).
 * - Inputs: account bootstrap facade.
 * - Outputs: ordered shutdown cleanup before app quit acknowledgement.
 */
export function useAppShutdown(input: UseAppShutdownInput): void {
  const { facade } = input;

  useEffect(() => {
    if (facade === null) {
      return undefined;
    }

    const unsubscribe = window.softphone.onBeforeClose((payload) => {
      void (async () => {
        const result = await facade.shutdownCleanup.execute({
          source: payload.source,
          correlationId: payload.correlationId,
        });

        if (isErr(result)) {
          return;
        }

        await window.softphone.acknowledgeShutdown(payload.correlationId);
      })();
    });

    return unsubscribe;
  }, [facade]);
}
