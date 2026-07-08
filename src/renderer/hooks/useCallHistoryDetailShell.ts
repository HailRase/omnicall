import { useMemo } from "react";
import { deriveCallHistoryDetailShell } from "@application/projections/contacts/deriveCallHistoryDetailShell.js";
import type { CallHistoryEntry } from "@domain/index.js";
import { createCallId } from "@domain/telephony/CallId.js";
import { createCallHistoryEntryId } from "@domain/settings/CallHistoryEntryId.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useI18n } from "../i18n/index.js";
import type { Translator } from "../i18n/index.js";
import { useShellRouteDataStore } from "../navigation/routeData/useShellRouteDataStore.js";
import type { HistoryEntryRouteSnapshot } from "../navigation/routeData/shellRouteDataModel.js";

type UseCallHistoryDetailShellInput = Readonly<{
  entryId: string;
  routeNotFound: boolean;
  isSipRegistered: boolean;
}>;

export type CallHistoryDetailViewModel = Readonly<{
  id: string;
  remoteNumber: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  contactId: string | null;
  directionLabel: string;
  outcomeLabel: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  redialDisabledReason: string | null;
}>;

export type UseCallHistoryDetailShellResult = Readonly<{
  isLoading: boolean;
  isNotFound: boolean;
  entry: CallHistoryDetailViewModel | null;
}>;

/**
 * - Purpose: map route-loaded history entry into localized detail view-model.
 * - Inputs: entry id, route not-found flag, and registration flag.
 * - Outputs: localized history detail state for presentational panel.
 */
export function useCallHistoryDetailShell({
  entryId,
  routeNotFound,
  isSipRegistered,
}: UseCallHistoryDetailShellInput): UseCallHistoryDetailShellResult {
  const { t, language } = useI18n();
  const callHistoryProjection = useAccountBootstrapStore((state) => state.callHistoryProjection);
  const contactsProjection = useAccountBootstrapStore((state) => state.contactsProjection);
  const multiCallProjection = useAccountBootstrapStore((state) => state.multiCallProjection);
  const activeHistoryEntry = useShellRouteDataStore((state) => state.activeHistoryEntry);

  const projectionEntry = useMemo(
    () => callHistoryProjection.entries.find((entry) => entry.id === entryId) ?? null,
    [callHistoryProjection.entries, entryId],
  );

  const routeEntry = useMemo(
    () =>
      resolveRouteHistoryEntry(
        entryId,
        routeNotFound,
        activeHistoryEntry,
        projectionEntry,
        contactsProjection.contacts,
        isSipRegistered,
        multiCallProjection,
        language,
        t,
      ),
    [
      activeHistoryEntry,
      entryId,
      isSipRegistered,
      language,
      multiCallProjection,
      projectionEntry,
      routeNotFound,
      contactsProjection.contacts,
      t,
    ],
  );

  return routeEntry;
}

function resolveRouteHistoryEntry(
  entryId: string,
  routeNotFound: boolean,
  activeHistoryEntry: ReturnType<typeof useShellRouteDataStore.getState>["activeHistoryEntry"],
  projectionEntry: CallHistoryEntry | null,
  contacts: ReturnType<typeof useAccountBootstrapStore.getState>["contactsProjection"]["contacts"],
  isSipRegistered: boolean,
  multiCallProjection: ReturnType<typeof useAccountBootstrapStore.getState>["multiCallProjection"],
  language: string,
  t: Translator,
): UseCallHistoryDetailShellResult {
  if (routeNotFound) {
    return {
      isLoading: false,
      isNotFound: true,
      entry: null,
    };
  }

  if (activeHistoryEntry === null || activeHistoryEntry.entryId !== entryId) {
    return {
      isLoading: true,
      isNotFound: false,
      entry: null,
    };
  }

  if (activeHistoryEntry.status === "loading") {
    return {
      isLoading: true,
      isNotFound: false,
      entry: null,
    };
  }

  if (activeHistoryEntry.status === "notFound" || activeHistoryEntry.status === "failed") {
    return {
      isLoading: false,
      isNotFound: activeHistoryEntry.status === "notFound",
      entry: null,
    };
  }

  const domainEntry = projectionEntry ?? mapSnapshotToDomainEntry(activeHistoryEntry.snapshot);
  if (domainEntry === null) {
    return {
      isLoading: false,
      isNotFound: true,
      entry: null,
    };
  }

  const detail = deriveCallHistoryDetailShell({
    entry: domainEntry,
    contacts,
    isSipRegistered,
    multiCallProjection,
  });

  return {
    isLoading: false,
    isNotFound: false,
    entry: mapDetailViewModel(detail, language, t),
  };
}

function mapSnapshotToDomainEntry(
  snapshot: HistoryEntryRouteSnapshot | null,
): CallHistoryEntry | null {
  if (snapshot === null) {
    return null;
  }

  const entryId = createCallHistoryEntryId(snapshot.id);
  if (entryId === null) {
    return null;
  }

  return {
    id: entryId,
    callId: createCallId("route-snapshot"),
    direction: snapshot.direction,
    remoteNumber: snapshot.remoteNumber,
    displayLabel: snapshot.displayLabel,
    startedAt: snapshot.startedAt,
    endedAt: snapshot.endedAt,
    durationSec: snapshot.durationSec,
    outcome: snapshot.outcome,
  };
}

function mapDetailViewModel(
  detail: ReturnType<typeof deriveCallHistoryDetailShell>,
  language: string,
  t: Translator,
): CallHistoryDetailViewModel {
  return {
    id: detail.id,
    remoteNumber: detail.remoteNumber,
    primaryLabel:
      detail.presentationSource === "unknown"
        ? t("history.entry.unknownCaller")
        : detail.primaryLabel,
    secondaryLabel: detail.secondaryLabel,
    contactId: detail.contactId,
    directionLabel: t(detail.directionKey),
    outcomeLabel: t(detail.outcomeKey),
    dateLabel: formatHistoryDate(detail.startedAtIso, language),
    timeLabel: formatHistoryTime(detail.startedAtIso, language),
    durationLabel:
      detail.durationSec > 0
        ? t("history.entry.duration", { seconds: detail.durationSec })
        : t("history.entry.noDuration"),
    redialDisabledReason:
      detail.redialDisabledReasonKey !== null ? t(detail.redialDisabledReasonKey) : null,
  };
}

function formatHistoryDate(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
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
