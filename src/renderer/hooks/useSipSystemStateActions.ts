import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveSipSystemStateShell,
  type SipConnectionJournalEntry,
  type SipSystemStateShellView,
  type UserSettings,
} from "@application/index.js";
import type { Result } from "@shared/result/index.js";
import type { PlatformError } from "@shared/errors/index.js";
import { useSipRecoveryCountdownTick } from "./useSipRecoveryCountdownTick.js";
import { useSoftphoneProjections } from "./useSoftphoneProjections.js";

type UseSipSystemStateShellInput = Readonly<{
  userSettings: UserSettings;
  journalEntries: ReadonlyArray<SipConnectionJournalEntry>;
}>;

/**
 * - Purpose: bind SIP session health and journal to settings system-state view-model.
 * - Inputs: user recovery settings and journal entries from facade.
 * - Outputs: derived SipSystemStateShellView with live countdown tick.
 */
export function useSipSystemStateShell(
  input: UseSipSystemStateShellInput,
): SipSystemStateShellView {
  const { sipSessionHealthProjection } = useSoftphoneProjections();
  const tickMs = useSipRecoveryCountdownTick(sipSessionHealthProjection);

  return useMemo(
    () =>
      deriveSipSystemStateShell({
        health: sipSessionHealthProjection,
        sipAutoReconnectEnabled: input.userSettings.sipAutoReconnectEnabled,
        sipAutoReregisterEnabled: input.userSettings.sipAutoReregisterEnabled,
        journalEntries: input.journalEntries,
        nowMs: tickMs,
      }),
    [
      sipSessionHealthProjection,
      input.userSettings.sipAutoReconnectEnabled,
      input.userSettings.sipAutoReregisterEnabled,
      input.journalEntries,
      tickMs,
    ],
  );
}

export type SipManualActionKind = "transport" | "reregister";

type UseSipSystemStateActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
}>;

type UseSipSystemStateActionsResult = Readonly<{
  journalEntries: ReadonlyArray<SipConnectionJournalEntry>;
  actionError: string | null;
  actionSuccess: string | null;
  actionLoading: SipManualActionKind | null;
  onManualTransportReconnect: () => void;
  onManualReregister: () => void;
  onClearJournal: () => void;
}>;

const ACTION_SUCCESS_MESSAGES: Record<SipManualActionKind, string> = {
  transport: "Переподключение сервера запущено",
  reregister: "Перерегистрация запущена",
};

const ACTION_SUCCESS_CLEAR_MS = 3200;

function resolveActionError(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось выполнить действие";
}

/**
 * - Purpose: wire manual SIP recovery actions and journal refresh for settings panel.
 * - Inputs: account bootstrap facade.
 * - Outputs: journal snapshot, action callbacks, loading/success/error feedback.
 */
export function useSipSystemStateActions(
  input: UseSipSystemStateActionsInput,
): UseSipSystemStateActionsResult {
  const { facade } = input;
  const [journalEntries, setJournalEntries] = useState<ReadonlyArray<SipConnectionJournalEntry>>(
    [],
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<SipManualActionKind | null>(null);
  const successClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuccessTimer = useCallback((): void => {
    if (successClearTimerRef.current !== null) {
      clearTimeout(successClearTimerRef.current);
      successClearTimerRef.current = null;
    }
  }, []);

  const scheduleSuccessClear = useCallback((): void => {
    clearSuccessTimer();
    successClearTimerRef.current = setTimeout(() => {
      setActionSuccess(null);
      successClearTimerRef.current = null;
    }, ACTION_SUCCESS_CLEAR_MS);
  }, [clearSuccessTimer]);

  useEffect(() => {
    return () => {
      clearSuccessTimer();
    };
  }, [clearSuccessTimer]);

  const refreshJournal = useCallback((): void => {
    if (facade === null) {
      setJournalEntries([]);
      return;
    }
    setJournalEntries(facade.getSipConnectionJournalEntries());
  }, [facade]);

  useEffect(() => {
    refreshJournal();
    if (facade === null) {
      return;
    }

    const unsubscribe = facade.eventPublisher.subscribe(() => {
      refreshJournal();
    });

    return unsubscribe;
  }, [facade, refreshJournal]);

  const runAction = useCallback(
    (kind: SipManualActionKind, action: () => Promise<Result<void, PlatformError>>): void => {
      if (facade === null || actionLoading !== null) {
        return;
      }

      setActionLoading(kind);
      setActionError(null);
      setActionSuccess(null);
      clearSuccessTimer();

      void action()
        .then((result) => {
          if (!result.ok) {
            setActionError(result.error.message);
            return;
          }
          setActionSuccess(ACTION_SUCCESS_MESSAGES[kind]);
          scheduleSuccessClear();
          refreshJournal();
        })
        .catch((error: unknown) => {
          setActionError(resolveActionError(error));
        })
        .finally(() => {
          setActionLoading(null);
        });
    },
    [facade, actionLoading, clearSuccessTimer, refreshJournal, scheduleSuccessClear],
  );

  const onManualTransportReconnect = useCallback((): void => {
    if (facade === null) {
      return;
    }
    runAction("transport", () => facade.manualSipTransportReconnectAccount());
  }, [facade, runAction]);

  const onManualReregister = useCallback((): void => {
    if (facade === null) {
      return;
    }
    runAction("reregister", () => facade.reregisterSipAccount());
  }, [facade, runAction]);

  const onClearJournal = useCallback((): void => {
    if (facade === null) {
      return;
    }
    facade.clearSipConnectionJournal();
    refreshJournal();
    setActionError(null);
    setActionSuccess(null);
    clearSuccessTimer();
  }, [facade, refreshJournal, clearSuccessTimer]);

  return {
    journalEntries,
    actionError,
    actionSuccess,
    actionLoading,
    onManualTransportReconnect,
    onManualReregister,
    onClearJournal,
  };
}
