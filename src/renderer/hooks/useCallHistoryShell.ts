import { useMemo } from "react";

import { deriveCallHistoryShell } from "@application/projections/contacts/deriveCallHistoryShell.js";

import type { CallHistoryShellViewModel } from "@application/projections/contacts/deriveCallHistoryShell.js";

import { resolveHistorySecondaryTimeLabel } from "../helpers/resolveHistorySecondaryTimeLabel.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

import { useI18n } from "../i18n/index.js";



type UseCallHistoryShellInput = Readonly<{

  isSipRegistered: boolean;

}>;



export type CallHistoryDirection = "incoming" | "outgoing";

export type CallHistoryOutcome = "completed" | "missed" | "failed";



export type CallHistoryEntryRowViewModel = Readonly<{

  id: string;

  remoteNumber: string;

  displayLabel: string | null;

  primaryLabel: string;

  directionLabel: string;

  outcomeLabel: string;

  startedAtLabel: string;

  timeLabel: string;

  startedAtIso: string;

  direction: CallHistoryDirection;

  outcome: CallHistoryOutcome;

  isMissed: boolean;

  durationLabel: string;

  secondaryTimeLabel: string;

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

  const contactsProjection = useAccountBootstrapStore((state) => state.contactsProjection);

  const multiCallProjection = useAccountBootstrapStore((state) => state.multiCallProjection);



  const shell = useMemo(

    () =>

      deriveCallHistoryShell({

        projection: callHistoryProjection,

        contacts: contactsProjection.contacts,

        isSipRegistered,

        multiCallProjection,

      }),

    [callHistoryProjection, contactsProjection.contacts, isSipRegistered, multiCallProjection],

  );



  const rows = useMemo(

    () =>

      shell.entries.map((entry) => ({

        id: entry.id,

        remoteNumber: entry.remoteNumber,

        displayLabel: entry.displayLabel,

        primaryLabel:
          entry.presentationSource === "unknown"
            ? t("history.entry.unknownCaller")
            : entry.primaryLabel,

        directionLabel: t(entry.directionKey),

        outcomeLabel: t(entry.outcomeKey),

        startedAtLabel: formatHistoryTimestamp(entry.startedAtIso, language),

        timeLabel: formatHistoryTime(entry.startedAtIso, language),

        startedAtIso: entry.startedAtIso,

        direction:
          entry.directionKey === "history.direction.incoming"
            ? ("incoming" as const)
            : ("outgoing" as const),

        outcome: mapOutcome(entry.outcomeKey),

        isMissed: entry.outcomeKey === "history.outcome.missed",

        durationLabel:

          entry.durationSec > 0

            ? t("history.entry.duration", { seconds: entry.durationSec })

            : t("history.entry.noDuration"),

        secondaryTimeLabel: resolveHistorySecondaryTimeLabel({

          entry,

          language,

          translateDuration: (seconds) => t("history.entry.duration", { seconds }),

          formatClockTime: formatHistoryTime,

        }),

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



function mapOutcome(

  outcomeKey: "history.outcome.completed" | "history.outcome.missed" | "history.outcome.failed",

): CallHistoryOutcome {

  switch (outcomeKey) {

    case "history.outcome.completed":

      return "completed";

    case "history.outcome.missed":

      return "missed";

    case "history.outcome.failed":

      return "failed";

  }

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



function formatHistoryTime(iso: string, language: string): string {

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {

    return iso;

  }

  return new Intl.DateTimeFormat(language, {

    timeStyle: "short",

  }).format(date);

}

