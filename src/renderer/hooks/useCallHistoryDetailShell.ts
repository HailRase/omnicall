import { useCallback, useMemo, useState } from "react";
import {
  deriveCallHistoryDetailShell,
  type CallHistoryDetailShellEntry,
} from "@application/projections/contacts/deriveCallHistoryDetailShell.js";
import { isErr } from "@shared/result/index.js";
import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";
import { useI18n } from "../i18n/index.js";
import type { Translator } from "../i18n/index.js";
import { useShellRouteDataStore } from "../navigation/routeData/useShellRouteDataStore.js";
import type { HistoryEntryRouteSnapshot } from "../navigation/routeData/shellRouteDataModel.js";
import type { UseCallHistoryActionsResult } from "./useCallHistoryActions.js";

type UseCallHistoryDetailShellInput = Readonly<{
  entryId: string;
  routeNotFound: boolean;
  isSipRegistered: boolean;
  actions: Pick<UseCallHistoryActionsResult, "deleteEntry">;
}>;

export type CallHistoryDetailViewModel = Readonly<{
  id: string;
  remoteNumber: string;
  primaryLabel: string;
  secondaryLabel: string | null;
  contactId: string | null;
  presentationSource: "contact" | "sip" | "number" | "unknown";
  directionLabel: string;
  outcomeLabel: string;
  endReasonLabel: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  ringDurationLabel: string;
  talkDurationLabel: string;
  redialDisabledReason: string | null;
}>;

export type UseCallHistoryDetailShellResult = Readonly<{
  isLoading: boolean;
  isNotFound: boolean;
  entry: CallHistoryDetailViewModel | null;
  deleteConfirmationOpen: boolean;
  deleteErrorMessage: string | null;
  isDeleting: boolean;
  openDeleteConfirmation: () => void;
  closeDeleteConfirmation: () => void;
  confirmDelete: () => Promise<boolean>;
}>;

type CallHistoryDetailRouteState = Readonly<{
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
  actions,
}: UseCallHistoryDetailShellInput): UseCallHistoryDetailShellResult {
  const { t, language } = useI18n();
  const callHistoryProjection = useAccountBootstrapStore((state) => state.callHistoryProjection);
  const contactsProjection = useAccountBootstrapStore((state) => state.contactsProjection);
  const multiCallProjection = useAccountBootstrapStore((state) => state.multiCallProjection);
  const activeHistoryEntry = useShellRouteDataStore((state) => state.activeHistoryEntry);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const openDeleteConfirmation = useCallback((): void => {
    setDeleteErrorMessage(null);
    setDeleteConfirmationOpen(true);
  }, []);

  const closeDeleteConfirmation = useCallback((): void => {
    setDeleteConfirmationOpen(false);
    setDeleteErrorMessage(null);
  }, []);

  const deleteEntry = actions.deleteEntry;

  const confirmDelete = useCallback(async (): Promise<boolean> => {
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    const result = await deleteEntry(entryId);
    setIsDeleting(false);

    if (isErr(result)) {
      setDeleteErrorMessage(t("history.error.deleteFailed"));
      return false;
    }

    setDeleteConfirmationOpen(false);
    return true;
  }, [deleteEntry, entryId, t]);

  return {
    ...routeEntry,
    deleteConfirmationOpen,
    deleteErrorMessage,
    isDeleting,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    confirmDelete,
  };
}

function resolveRouteHistoryEntry(
  entryId: string,
  routeNotFound: boolean,
  activeHistoryEntry: ReturnType<typeof useShellRouteDataStore.getState>["activeHistoryEntry"],
  projectionEntry: CallHistoryDetailShellEntry | null,
  contacts: ReturnType<typeof useAccountBootstrapStore.getState>["contactsProjection"]["contacts"],
  isSipRegistered: boolean,
  multiCallProjection: ReturnType<typeof useAccountBootstrapStore.getState>["multiCallProjection"],
  language: string,
  t: Translator,
): CallHistoryDetailRouteState {
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

  const detailEntry = projectionEntry ?? mapSnapshotToDetailEntry(activeHistoryEntry.snapshot);
  if (detailEntry === null) {
    return {
      isLoading: false,
      isNotFound: true,
      entry: null,
    };
  }

  const detail = deriveCallHistoryDetailShell({
    entry: detailEntry,
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

function mapSnapshotToDetailEntry(
  snapshot: HistoryEntryRouteSnapshot | null,
): CallHistoryDetailShellEntry | null {
  if (snapshot === null) {
    return null;
  }

  return {
    id: snapshot.id,
    direction: snapshot.direction,
    remoteNumber: snapshot.remoteNumber,
    displayLabel: snapshot.displayLabel,
    startedAt: snapshot.startedAt,
    durationSec: snapshot.durationSec,
    ringDurationSec: snapshot.ringDurationSec,
    talkDurationSec: snapshot.talkDurationSec,
    outcome: snapshot.outcome,
    endReason: snapshot.endReason,
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
    presentationSource: detail.presentationSource,
    directionLabel: t(detail.directionKey),
    outcomeLabel: t(detail.outcomeKey),
    endReasonLabel: t(detail.endReasonKey),
    dateLabel: formatHistoryDate(detail.startedAtIso, language),
    timeLabel: formatHistoryTime(detail.startedAtIso, language),
    durationLabel:
      detail.durationSec > 0
        ? t("history.entry.duration", { seconds: detail.durationSec })
        : t("history.entry.noDuration"),
    ringDurationLabel:
      detail.ringDurationSec > 0
        ? t("history.entry.duration", { seconds: detail.ringDurationSec })
        : t("history.entry.noDuration"),
    talkDurationLabel:
      detail.talkDurationSec > 0
        ? t("history.entry.duration", { seconds: detail.talkDurationSec })
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
