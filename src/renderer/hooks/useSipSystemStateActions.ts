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
import type { TranslationKey } from "../i18n/messages.js";
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

export type SipManualActionSuccessKey =
  | "settings.systemState.action.success.transport"
  | "settings.systemState.action.success.reregister";

type UseSipSystemStateActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
}>;

type UseSipSystemStateActionsResult = Readonly<{
  journalEntries: ReadonlyArray<SipConnectionJournalEntry>;
  actionErrorKey: TranslationKey | null;
  actionErrorDetail: string | null;
  actionSuccessKey: SipManualActionSuccessKey | null;
  actionLoading: SipManualActionKind | null;
  onManualTransportReconnect: () => void;
  onManualReregister: () => void;
  onClearJournal: () => void;
}>;

const ACTION_SUCCESS_KEYS: Record<SipManualActionKind, SipManualActionSuccessKey> = {
  transport: "settings.systemState.action.success.transport",
  reregister: "settings.systemState.action.success.reregister",
};

const ACTION_ERROR_UNKNOWN_KEY = "settings.systemState.action.error.unknown" as const;

const ACTION_SUCCESS_CLEAR_MS = 3200;

/**
 * - Purpose: wire manual SIP recovery actions and journal refresh for settings panel.
 * - Inputs: account bootstrap facade.
 * - Outputs: journal snapshot, action callbacks, loading/success/error feedback keys.
 */
export function useSipSystemStateActions(
  input: UseSipSystemStateActionsInput,
): UseSipSystemStateActionsResult {
  const { facade } = input;
  const [journalEntries, setJournalEntries] = useState<ReadonlyArray<SipConnectionJournalEntry>>(
    [],
  );
  const [actionErrorKey, setActionErrorKey] = useState<TranslationKey | null>(null);
  const [actionErrorDetail, setActionErrorDetail] = useState<string | null>(null);
  const [actionSuccessKey, setActionSuccessKey] = useState<SipManualActionSuccessKey | null>(null);
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
      setActionSuccessKey(null);
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
      setActionErrorKey(null);
      setActionErrorDetail(null);
      setActionSuccessKey(null);
      clearSuccessTimer();

      void action()
        .then((result) => {
          if (!result.ok) {
            setActionErrorDetail(result.error.message);
            return;
          }
          setActionSuccessKey(ACTION_SUCCESS_KEYS[kind]);
          scheduleSuccessClear();
          refreshJournal();
        })
        .catch(() => {
          setActionErrorKey(ACTION_ERROR_UNKNOWN_KEY);
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
    setActionErrorKey(null);
    setActionErrorDetail(null);
    setActionSuccessKey(null);
    clearSuccessTimer();
  }, [facade, refreshJournal, clearSuccessTimer]);

  return {
    journalEntries,
    actionErrorKey,
    actionErrorDetail,
    actionSuccessKey,
    actionLoading,
    onManualTransportReconnect,
    onManualReregister,
    onClearJournal,
  };
}
