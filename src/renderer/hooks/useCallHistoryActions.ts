import { useCallback, useMemo } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { isErr } from "@shared/result/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import type { NotificationDescriptor } from "./useNotifications.js";

type RedialResult = Awaited<ReturnType<AccountBootstrapFacade["redialFromHistory"]>>;

type UseCallHistoryActionsInput = Readonly<{
  facade: AccountBootstrapFacade;
  notify?: (descriptor: NotificationDescriptor) => void;
}>;

/**
 * - Purpose: bind call history load and redial actions to facade Use Cases.
 * - Inputs: account bootstrap facade.
 * - Outputs: load and redial callbacks for history shell wiring.
 */
export function useCallHistoryActions({ facade, notify }: UseCallHistoryActionsInput) {
  const setCallHistoryLoading = useAccountBootstrapStore((state) => state.setCallHistoryLoading);
  const setCallHistoryLoaded = useAccountBootstrapStore((state) => state.setCallHistoryLoaded);
  const setCallHistoryLoadError = useAccountBootstrapStore((state) => state.setCallHistoryLoadError);

  const loadHistory = useCallback(async (): Promise<void> => {
    setCallHistoryLoading();
    const result = await facade.listCallHistory();
    if (isErr(result)) {
      setCallHistoryLoadError("history.error.loadFailed");
      return;
    }
    setCallHistoryLoaded(result.value);
  }, [facade, setCallHistoryLoadError, setCallHistoryLoaded, setCallHistoryLoading]);

  const redialEntry = useCallback(
    async (entryId: string): Promise<RedialResult> => {
      const result = await facade.redialFromHistory(entryId);
      if (isErr(result)) {
        notify?.({
          level: "error",
          messageKey: "history.error.redialFailed",
        });
      }
      return result;
    },
    [facade, notify],
  );

  const getHistoryEntry = useCallback(
    async (entryId: string) => facade.getCallHistoryEntry(entryId),
    [facade],
  );

  return useMemo(
    () => ({
      loadHistory,
      redialEntry,
      getHistoryEntry,
    }),
    [getHistoryEntry, loadHistory, redialEntry],
  );
}

export type UseCallHistoryActionsResult = ReturnType<typeof useCallHistoryActions>;
