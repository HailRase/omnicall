/**
 * - Purpose: load and refresh External Services journal projection for Settings UI.
 * - Inputs: facade query outcome and active-screen flag.
 * - Outputs: UI-safe journal panel VM and retry callback without Domain access.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  deriveExternalServicesJournalFromOutcome,
  EXTERNAL_SERVICES_JOURNAL_UI_LIMIT,
  type ExternalServicesJournalPanelVm,
} from "@application/index.js";

export type UseExternalServicesJournalResult = Readonly<{
  panel: ExternalServicesJournalPanelVm;
  refresh: () => Promise<void>;
}>;

type UseExternalServicesJournalInput = Readonly<{
  facade: AccountBootstrapFacade | null;
  active: boolean;
}>;

/**
 * - Purpose: query newest journal rows when the collections screen is visible.
 * - Inputs: account bootstrap facade and screen activity flag.
 * - Outputs: capped journal panel VM for presentational rendering.
 */
export function useExternalServicesJournal(
  input: UseExternalServicesJournalInput,
): UseExternalServicesJournalResult {
  const { facade, active } = input;
  const [panel, setPanel] = useState<ExternalServicesJournalPanelVm>(() =>
    deriveExternalServicesJournalFromOutcome(null, "loading"),
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (facade === null) {
      setPanel(deriveExternalServicesJournalFromOutcome(null, "unavailable"));
      return;
    }

    setPanel((previous) =>
      previous.loadState === "ready"
        ? previous
        : deriveExternalServicesJournalFromOutcome(null, "loading"),
    );

    const result = await facade.queryExternalServices({
      journalLimit: EXTERNAL_SERVICES_JOURNAL_UI_LIMIT,
    });
    if (!result.ok) {
      setPanel(deriveExternalServicesJournalFromOutcome(null, "error"));
      return;
    }

    setPanel(deriveExternalServicesJournalFromOutcome(result.value, "ready"));
  }, [facade]);

  useEffect(() => {
    if (!active) {
      return;
    }
    void refresh();
  }, [active, refresh]);

  return useMemo(
    () => ({
      panel,
      refresh,
    }),
    [panel, refresh],
  );
}
