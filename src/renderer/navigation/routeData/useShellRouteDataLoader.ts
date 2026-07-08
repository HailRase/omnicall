import { useEffect, useRef } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { isErr } from "@shared/result/index.js";
import { useAccountBootstrapStore } from "../../stores/useAccountBootstrapStore.js";
import { useCallHistoryActions } from "../../hooks/useCallHistoryActions.js";
import { useContactActions } from "../../hooks/useContactActions.js";
import {
  findProjectionContact,
  isContactRouteLoadFailureCode,
  mapContactToRouteSnapshot,
  resolveContactRouteInitialStatus,
  resolveContactsRouteLoadTarget,
  shouldStartContactsListLoad,
} from "./contactsRouteDataController.js";
import {
  findProjectionHistoryEntry,
  isHistoryEntryRouteLoadFailureCode,
  mapHistoryEntryToRouteSnapshot,
  resolveHistoryEntryRouteInitialStatus,
  resolveHistoryRouteLoadTarget,
  shouldStartHistoryListLoad,
} from "./historyEntryRouteDataController.js";
import { runLoadOnce } from "./loadCoordinator.js";
import { useShellRouteDataStore } from "./useShellRouteDataStore.js";
import { useShellNavigation } from "../useShellNavigation.js";

type UseShellRouteDataLoaderInput = Readonly<{
  facade: AccountBootstrapFacade;
  activeProfileSyncKey: string | null;
}>;

let contactsListTokenCounter = 0;
let historyListTokenCounter = 0;
let contactRouteTokenCounter = 0;
let historyEntryRouteTokenCounter = 0;

function nextContactsListToken(): number {
  contactsListTokenCounter += 1;
  return contactsListTokenCounter;
}

function nextHistoryListToken(): number {
  historyListTokenCounter += 1;
  return historyListTokenCounter;
}

function nextContactRouteToken(): number {
  contactRouteTokenCounter += 1;
  return contactRouteTokenCounter;
}

function nextHistoryEntryRouteToken(): number {
  historyEntryRouteTokenCounter += 1;
  return historyEntryRouteTokenCounter;
}

function shouldSkipContactRouteReload(input: Readonly<{
  contactId: string;
  routeNotFound: boolean;
}>): boolean {
  const existing = useShellRouteDataStore.getState().activeContact;
  if (existing === null || existing.contactId !== input.contactId) {
    return false;
  }

  if (input.routeNotFound) {
    return existing.status === "notFound";
  }

  return existing.status === "loading" || existing.status === "loaded";
}

function shouldSkipHistoryEntryRouteReload(input: Readonly<{
  entryId: string;
  routeNotFound: boolean;
}>): boolean {
  const existing = useShellRouteDataStore.getState().activeHistoryEntry;
  if (existing === null || existing.entryId !== input.entryId) {
    return false;
  }

  if (input.routeNotFound) {
    return existing.status === "notFound";
  }

  return existing.status === "loading" || existing.status === "loaded";
}

/**
 * - Purpose: orchestrate contacts/history route enter loads with race-safe guards.
 * - Inputs: account bootstrap facade and current parsed shell route.
 * - Outputs: route data store mutations and facade list/get side effects.
 */
export function useShellRouteDataLoader({
  facade,
  activeProfileSyncKey,
}: UseShellRouteDataLoaderInput): void {
  const { route } = useShellNavigation();
  const contactActions = useContactActions({ facade });
  const historyActions = useCallHistoryActions({ facade });
  const activeContactRequestRef = useRef<number>(0);
  const activeHistoryEntryRequestRef = useRef<number>(0);

  useEffect(() => {
    const contactsTarget = resolveContactsRouteLoadTarget(route);
    const historyTarget = resolveHistoryRouteLoadTarget(route);

    if (contactsTarget.kind === "contact") {
      const { contactId, routeNotFound, isCreateRoute } = contactsTarget;

      if (shouldSkipContactRouteReload({ contactId, routeNotFound })) {
        return;
      }

      const contactsProjection = useAccountBootstrapStore.getState().contactsProjection;
      const projectionContact = findProjectionContact(contactsProjection, contactId);
      const initialStatus = resolveContactRouteInitialStatus({
        routeNotFound,
        isCreateRoute,
        projectionContact,
      });
      const token = nextContactRouteToken();
      activeContactRequestRef.current = token;

      useShellRouteDataStore.getState().setActiveContact({
        contactId,
        status: initialStatus,
        activeToken: token,
        snapshot:
          projectionContact !== null ? mapContactToRouteSnapshot(projectionContact) : null,
      });

      if (initialStatus !== "loading") {
        return;
      }

      void (async () => {
        const result = await contactActions.getContact(contactId);
        if (activeContactRequestRef.current !== token) {
          return;
        }

        if (isErr(result)) {
          const status = isContactRouteLoadFailureCode(result.error.code)
            ? "notFound"
            : "failed";
          useShellRouteDataStore.getState().updateActiveContactStatus(
            contactId,
            token,
            status,
            null,
          );
          return;
        }

        const refreshedProjection = findProjectionContact(
          useAccountBootstrapStore.getState().contactsProjection,
          contactId,
        );
        const snapshot =
          refreshedProjection !== null
            ? mapContactToRouteSnapshot(refreshedProjection)
            : mapContactToRouteSnapshot(result.value);

        useShellRouteDataStore.getState().updateActiveContactStatus(
          contactId,
          token,
          "loaded",
          snapshot,
        );
      })();
    } else {
      useShellRouteDataStore.getState().setActiveContact(null);
    }

    if (historyTarget.kind === "entry") {
      const { entryId, routeNotFound } = historyTarget;

      if (shouldSkipHistoryEntryRouteReload({ entryId, routeNotFound })) {
        return;
      }

      const callHistoryProjection = useAccountBootstrapStore.getState().callHistoryProjection;
      const projectionEntry = findProjectionHistoryEntry(callHistoryProjection, entryId);
      const initialStatus = resolveHistoryEntryRouteInitialStatus({
        routeNotFound,
        projectionEntry,
      });
      const token = nextHistoryEntryRouteToken();
      activeHistoryEntryRequestRef.current = token;

      useShellRouteDataStore.getState().setActiveHistoryEntry({
        entryId,
        status: initialStatus,
        activeToken: token,
        snapshot:
          projectionEntry !== null ? mapHistoryEntryToRouteSnapshot(projectionEntry) : null,
      });

      if (initialStatus !== "loading") {
        return;
      }

      void (async () => {
        const result = await historyActions.getHistoryEntry(entryId);
        if (activeHistoryEntryRequestRef.current !== token) {
          return;
        }

        if (isErr(result)) {
          const status = isHistoryEntryRouteLoadFailureCode(result.error.code)
            ? "notFound"
            : "failed";
          useShellRouteDataStore.getState().updateActiveHistoryEntryStatus(
            entryId,
            token,
            status,
            null,
          );
          return;
        }

        const refreshedProjection = findProjectionHistoryEntry(
          useAccountBootstrapStore.getState().callHistoryProjection,
          entryId,
        );
        const snapshot =
          refreshedProjection !== null
            ? mapHistoryEntryToRouteSnapshot(refreshedProjection)
            : mapHistoryEntryToRouteSnapshot(result.value);

        useShellRouteDataStore.getState().updateActiveHistoryEntryStatus(
          entryId,
          token,
          "loaded",
          snapshot,
        );
      })();
    } else {
      useShellRouteDataStore.getState().setActiveHistoryEntry(null);
    }

    if (contactsTarget.kind === "list") {
      const routeData = useShellRouteDataStore.getState();
      if (
        !shouldStartContactsListLoad({
          inFlight: routeData.contactsList.inFlight,
        })
      ) {
        return;
      }

      const token = nextContactsListToken();
      useShellRouteDataStore.getState().beginContactsListLoad(token);

      void runLoadOnce("contacts-list", async () => {
        await contactActions.loadContacts();
        const latestToken = useShellRouteDataStore.getState().contactsList.activeToken;
        if (latestToken !== token) {
          return;
        }

        const projectionStatus = useAccountBootstrapStore.getState().contactsProjection.status;
        if (projectionStatus === "error") {
          useShellRouteDataStore.getState().failContactsListLoad(token);
          return;
        }

        useShellRouteDataStore.getState().completeContactsListLoad(token);
      });
    }

    if (historyTarget.kind === "list") {
      const routeData = useShellRouteDataStore.getState();
      if (
        !shouldStartHistoryListLoad({
          inFlight: routeData.historyList.inFlight,
        })
      ) {
        return;
      }

      const token = nextHistoryListToken();
      useShellRouteDataStore.getState().beginHistoryListLoad(token);

      void runLoadOnce("history-list", async () => {
        await historyActions.loadHistory();
        const latestToken = useShellRouteDataStore.getState().historyList.activeToken;
        if (latestToken !== token) {
          return;
        }

        const projectionStatus = useAccountBootstrapStore.getState().callHistoryProjection.status;
        if (projectionStatus === "error") {
          useShellRouteDataStore.getState().failHistoryListLoad(token);
          return;
        }

        useShellRouteDataStore.getState().completeHistoryListLoad(token);
      });
    }
  }, [activeProfileSyncKey, contactActions, historyActions, route]);
}
