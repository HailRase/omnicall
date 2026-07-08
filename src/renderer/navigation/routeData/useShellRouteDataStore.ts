import { create } from "zustand";
import {
  initialShellRouteDataState,
  type ContactRouteData,
  type ContactRouteSnapshot,
  type HistoryEntryRouteData,
  type HistoryEntryRouteSnapshot,
  type ListRouteData,
  type RouteDataLoadStatus,
  type ShellRouteDataState,
} from "./shellRouteDataModel.js";

type ShellRouteDataActions = Readonly<{
  reset: () => void;
  beginContactsListLoad: (token: number) => void;
  completeContactsListLoad: (token: number) => void;
  failContactsListLoad: (token: number) => void;
  beginHistoryListLoad: (token: number) => void;
  completeHistoryListLoad: (token: number) => void;
  failHistoryListLoad: (token: number) => void;
  setActiveContact: (contact: ContactRouteData | null) => void;
  updateActiveContactStatus: (
    contactId: string,
    token: number,
    status: RouteDataLoadStatus,
    snapshot?: ContactRouteSnapshot | null,
  ) => void;
  clearActiveContactIfMatches: (contactId: string) => void;
  setActiveHistoryEntry: (entry: HistoryEntryRouteData | null) => void;
  updateActiveHistoryEntryStatus: (
    entryId: string,
    token: number,
    status: RouteDataLoadStatus,
    snapshot?: HistoryEntryRouteSnapshot | null,
  ) => void;
}>;

type ShellRouteDataStore = ShellRouteDataState & ShellRouteDataActions;

function withListLoadStarted(token: number): ListRouteData {
  return {
    status: "loading",
    activeToken: token,
    inFlight: true,
  };
}

function withListLoadFinished(
  listRoute: ListRouteData,
  token: number,
  status: RouteDataLoadStatus,
): ListRouteData {
  if (listRoute.activeToken !== token) {
    return listRoute;
  }

  return {
    status,
    activeToken: token,
    inFlight: false,
  };
}

/**
 * - Purpose: route-scoped load lifecycle read model for contacts and history panels.
 * - Inputs: route controller mutations and selectors.
 * - Outputs: list/contact load status tokens without domain business rules.
 */
export const useShellRouteDataStore = create<ShellRouteDataStore>((set, get) => ({
  ...initialShellRouteDataState(),

  reset: () => {
    set(initialShellRouteDataState());
  },

  beginContactsListLoad: (token) => {
    set({
      contactsList: withListLoadStarted(token),
    });
  },

  completeContactsListLoad: (token) => {
    set((state) => ({
      contactsList: withListLoadFinished(state.contactsList, token, "loaded"),
    }));
  },

  failContactsListLoad: (token) => {
    set((state) => ({
      contactsList: withListLoadFinished(state.contactsList, token, "failed"),
    }));
  },

  beginHistoryListLoad: (token) => {
    set({
      historyList: withListLoadStarted(token),
    });
  },

  completeHistoryListLoad: (token) => {
    set((state) => ({
      historyList: withListLoadFinished(state.historyList, token, "loaded"),
    }));
  },

  failHistoryListLoad: (token) => {
    set((state) => ({
      historyList: withListLoadFinished(state.historyList, token, "failed"),
    }));
  },

  setActiveContact: (contact) => {
    set({ activeContact: contact });
  },

  updateActiveContactStatus: (contactId, token, status, snapshot = null) => {
    const current = get().activeContact;
    if (current === null || current.activeToken !== token || current.contactId !== contactId) {
      return;
    }

    set({
      activeContact: {
        contactId,
        status,
        activeToken: token,
        snapshot,
      },
    });
  },

  clearActiveContactIfMatches: (contactId) => {
    const current = get().activeContact;
    if (current?.contactId === contactId) {
      set({ activeContact: null });
    }
  },

  setActiveHistoryEntry: (entry) => {
    set({ activeHistoryEntry: entry });
  },

  updateActiveHistoryEntryStatus: (entryId, token, status, snapshot = null) => {
    const current = get().activeHistoryEntry;
    if (current === null || current.activeToken !== token || current.entryId !== entryId) {
      return;
    }

    set({
      activeHistoryEntry: {
        entryId,
        status,
        activeToken: token,
        snapshot,
      },
    });
  },
}));
