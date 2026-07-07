import { useMemo } from "react";
import { deriveCallHistoryShell } from "@application/projections/deriveCallHistoryShell.js";
import type { CallHistoryShellViewModel } from "@application/projections/deriveCallHistoryShell.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useI18n } from "../i18n/index.js";

type UseCallHistoryShellInput = Readonly<{
  isSipRegistered: boolean;
}>;

export type CallHistoryEntryRowViewModel = Readonly<{
  id: string;
  remoteNumber: string;
  displayLabel: string | null;
  directionLabel: string;
  outcomeLabel: string;
  startedAtLabel: string;
  durationLabel: string;
  redialDisabledReason: string | null;
}>;

export type UseCallHistoryShellResult = Readonly<{
  shell: CallHistoryShellViewModel;
  rows: ReadonlyArray<CallHistoryEntryRowViewModel>;
  isLoading: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
}>;

/**
 * - Purpose: compose call history projection into localized shell view-model rows.
 * - Inputs: registration flag from auth shell projection.
 * - Outputs: localized history list rows derived from call history projection only.
 */
export function useCallHistoryShell({
  isSipRegistered,
}: UseCallHistoryShellInput): UseCallHistoryShellResult {
  const { t, language } = useI18n();
  const callHistoryProjection = useAccountBootstrapStore((state) => state.callHistoryProjection);
  const multiCallProjection = useAccountBootstrapStore((state) => state.multiCallProjection);

  const shell = useMemo(
    () =>
      deriveCallHistoryShell({
        projection: callHistoryProjection,
        isSipRegistered,
        multiCallProjection,
      }),
    [callHistoryProjection, isSipRegistered, multiCallProjection],
  );

  const rows = useMemo(
    () =>
      shell.entries.map((entry) => ({
        id: entry.id,
        remoteNumber: entry.remoteNumber,
        displayLabel: entry.displayLabel,
        directionLabel: t(entry.directionKey),
        outcomeLabel: t(entry.outcomeKey),
        startedAtLabel: formatHistoryTimestamp(entry.startedAtIso, language),
        durationLabel:
          entry.durationSec > 0
            ? t("history.entry.duration", { seconds: entry.durationSec })
            : t("history.entry.noDuration"),
        redialDisabledReason:
          entry.redialDisabledReasonKey !== null ? t(entry.redialDisabledReasonKey) : null,
      })),
    [language, shell.entries, t],
  );

  return {
    shell,
    rows,
    isLoading: shell.status === "loading",
    isEmpty: shell.isEmpty,
    errorMessage:
      shell.errorKey !== null ? t(shell.errorKey) : null,
  };
}

function formatHistoryTimestamp(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(language, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
