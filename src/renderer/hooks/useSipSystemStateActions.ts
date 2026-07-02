import { useCallback, useEffect, useMemo, useState } from "react";
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

type UseSipSystemStateActionsInput = Readonly<{
  facade: AccountBootstrapFacade | null;
}>;

type UseSipSystemStateActionsResult = Readonly<{
  journalEntries: ReadonlyArray<SipConnectionJournalEntry>;
  actionError: string | null;
  onManualTransportReconnect: () => void;
  onManualReregister: () => void;
  onForceRefreshRegistration: () => void;
  onClearJournal: () => void;
}>;

function resolveActionError(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось выполнить действие";
}

/**
 * - Purpose: wire manual SIP recovery actions and journal refresh for settings panel.
 * - Inputs: account bootstrap facade.
 * - Outputs: journal snapshot, action callbacks, and observable action errors.
 */
export function useSipSystemStateActions(
  input: UseSipSystemStateActionsInput,
): UseSipSystemStateActionsResult {
  const { facade } = input;
  const [journalEntries, setJournalEntries] = useState<ReadonlyArray<SipConnectionJournalEntry>>(
    [],
  );
  const [actionError, setActionError] = useState<string | null>(null);

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
    (action: () => Promise<Result<void, PlatformError>>): void => {
      if (facade === null) {
        return;
      }

      void action()
        .then((result) => {
          if (!result.ok) {
            setActionError(result.error.message);
            return;
          }
          setActionError(null);
          refreshJournal();
        })
        .catch((error: unknown) => {
          setActionError(resolveActionError(error));
        });
    },
    [facade, refreshJournal],
  );

  const onManualTransportReconnect = useCallback((): void => {
    if (facade === null) {
      return;
    }
    runAction(() => facade.manualSipTransportReconnectAccount());
  }, [facade, runAction]);

  const onManualReregister = useCallback((): void => {
    if (facade === null) {
      return;
    }
    runAction(() => facade.reregisterSipAccount());
  }, [facade, runAction]);

  const onForceRefreshRegistration = useCallback((): void => {
    if (facade === null) {
      return;
    }
    runAction(() => facade.forceRefreshSipRegistrationAccount());
  }, [facade, runAction]);

  const onClearJournal = useCallback((): void => {
    if (facade === null) {
      return;
    }
    facade.clearSipConnectionJournal();
    refreshJournal();
    setActionError(null);
  }, [facade, refreshJournal]);

  return {
    journalEntries,
    actionError,
    onManualTransportReconnect,
    onManualReregister,
    onForceRefreshRegistration,
    onClearJournal,
  };
}
