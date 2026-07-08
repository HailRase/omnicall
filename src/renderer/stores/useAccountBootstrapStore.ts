import { create } from "zustand";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { MultiCallSettings } from "@application/index.js";
import {
  initialAccountBootstrapProjection,
  reduceAccountBootstrapProjection,
  type AccountBootstrapProjection,
} from "@application/projections/settings/accountBootstrapProjection.js";
import {
  initialCallProjection,
  reduceCallProjection,
  setDialpadMode,
  type CallProjection,
  type DialpadMode,
} from "@application/projections/telephony/callProjection.js";
import {
  initialActiveCallControlsProjection,
  reduceActiveCallControlsProjection,
  type ActiveCallControlsProjection,
} from "@application/projections/telephony/activeCallControlsProjection.js";
import {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
  setIncomingCallUiState,
  setIncomingRejectReasonRequired,
  type IncomingCallProjection,
  type IncomingCallUiState,
} from "@application/projections/telephony/incomingCallProjection.js";
import {
  initialMultiCallProjection,
  reduceMultiCallProjection,
  setMultiCallSettings,
  type MultiCallProjection,
} from "@application/projections/telephony/multiCallProjection.js";
import {
  initialTransferProjection,
  reduceTransferProjection,
  type TransferProjection,
} from "@application/projections/telephony/transferProjection.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
  type MultiLineCallProjection,
} from "@application/projections/telephony/multiLineCallProjection.js";
import {
  applyCallHistoryLoadError,
  applyCallHistoryLoaded,
  applyCallHistoryLoading,
  initialCallHistoryProjection,
  reduceCallHistoryProjection,
  type CallHistoryProjection,
} from "@application/projections/contacts/callHistoryProjection.js";
import {
  applyContactsLoadError,
  applyContactsLoaded,
  applyContactsLoading,
  initialContactsProjection,
  reduceContactsProjection,
  type ContactsProjection,
} from "@application/projections/contacts/contactsProjection.js";
import {
  initialSipSessionHealthProjection,
  reduceSipSessionHealthProjection,
  type SipSessionHealthProjection,
} from "@application/projections/telephony/sipSessionHealthProjection.js";
type AccountBootstrapStore = Readonly<{
  projection: AccountBootstrapProjection;
  callProjection: CallProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  incomingCallProjection: IncomingCallProjection;
  multiCallProjection: MultiCallProjection;
  transferProjection: TransferProjection;
  multiLineCallProjection: MultiLineCallProjection;
  sipSessionHealthProjection: SipSessionHealthProjection;
  callHistoryProjection: CallHistoryProjection;
  contactsProjection: ContactsProjection;
  bindFacade: (facade: AccountBootstrapFacade) => () => void;
  setCallMode: (mode: DialpadMode, dtmfPanelCallId?: string | null) => void;
  setIncomingUiState: (uiState: IncomingCallUiState) => void;
  setIncomingRejectReasonRequired: (required: boolean) => void;
  setIncomingBreakReason: (reason: string | null) => void;
  applyMultiCallSettings: (settings: MultiCallSettings) => void;
  setCallHistoryLoading: () => void;
  setCallHistoryLoaded: (
    entries: CallHistoryProjection["entries"],
  ) => void;
  setCallHistoryLoadError: (errorKey: string) => void;
  setContactsLoading: () => void;
  setContactsLoaded: (
    contacts: ContactsProjection["contacts"],
  ) => void;
  setContactsLoadError: (errorKey: string) => void;
}>;

export const useAccountBootstrapStore = create<AccountBootstrapStore>((set) => ({
  projection: initialAccountBootstrapProjection(),
  callProjection: initialCallProjection(),
  activeCallControlsProjection: initialActiveCallControlsProjection(),
  incomingCallProjection: initialIncomingCallProjection(),
  multiCallProjection: initialMultiCallProjection(),
  transferProjection: initialTransferProjection(),
  multiLineCallProjection: initialMultiLineCallProjection(),
  sipSessionHealthProjection: initialSipSessionHealthProjection(),
  callHistoryProjection: initialCallHistoryProjection(),
  contactsProjection: initialContactsProjection(),

  bindFacade: (facade) => {
    const refreshMultiCallProjection = (): void => {
      void facade.refreshUserSettingsProjections({
        applyMultiCallSettings: (settings) => {
          set((state) => ({
            multiCallProjection: setMultiCallSettings(state.multiCallProjection, settings),
          }));
        },
      });
    };

    const refreshProfileScopedDataProjections = (): void => {
      void facade.refreshProfileScopedDataProjections({
        setContactsLoading: () => {
          set((state) => ({
            contactsProjection: applyContactsLoading(state.contactsProjection),
          }));
        },
        setContactsLoaded: (contacts) => {
          set((state) => ({
            contactsProjection: applyContactsLoaded(state.contactsProjection, contacts),
          }));
        },
        setContactsLoadError: (errorKey) => {
          set((state) => ({
            contactsProjection: applyContactsLoadError(state.contactsProjection, errorKey),
          }));
        },
        setCallHistoryLoading: () => {
          set((state) => ({
            callHistoryProjection: applyCallHistoryLoading(state.callHistoryProjection),
          }));
        },
        setCallHistoryLoaded: (entries) => {
          set((state) => ({
            callHistoryProjection: applyCallHistoryLoaded(state.callHistoryProjection, entries),
          }));
        },
        setCallHistoryLoadError: (errorKey) => {
          set((state) => ({
            callHistoryProjection: applyCallHistoryLoadError(state.callHistoryProjection, errorKey),
          }));
        },
      });
    };

    refreshMultiCallProjection();

    const unsubscribe = facade.eventPublisher.subscribe((event) => {
      set((state) => ({
        projection: reduceAccountBootstrapProjection(state.projection, event),
        callProjection: reduceCallProjection(state.callProjection, event),
        activeCallControlsProjection: reduceActiveCallControlsProjection(
          state.activeCallControlsProjection,
          event,
        ),
        incomingCallProjection: reduceIncomingCallProjection(
          state.incomingCallProjection,
          event,
        ),
        multiCallProjection: reduceMultiCallProjection(state.multiCallProjection, event),
        transferProjection: reduceTransferProjection(state.transferProjection, event),
        multiLineCallProjection: reduceMultiLineCallProjection(
          state.multiLineCallProjection,
          event,
        ),
        sipSessionHealthProjection: reduceSipSessionHealthProjection(
          state.sipSessionHealthProjection,
          event,
        ),
        callHistoryProjection: reduceCallHistoryProjection(
          state.callHistoryProjection,
          event,
        ),
        contactsProjection: reduceContactsProjection(
          state.contactsProjection,
          event,
        ),
      }));

      if (event.type === "RegistrationSucceeded") {
        refreshMultiCallProjection();
        refreshProfileScopedDataProjections();
      }
    });

    return unsubscribe;
  },

  setCallMode: (mode, dtmfPanelCallId = null) => {
    set((state) => ({
      callProjection: setDialpadMode(state.callProjection, mode, dtmfPanelCallId),
    }));
  },

  setIncomingUiState: (uiState) => {
    set((state) => ({
      incomingCallProjection: setIncomingCallUiState(
        state.incomingCallProjection,
        uiState,
      ),
    }));
  },

  setIncomingRejectReasonRequired: (required) => {
    set((state) => ({
      incomingCallProjection: setIncomingRejectReasonRequired(
        state.incomingCallProjection,
        required,
      ),
    }));
  },

  setIncomingBreakReason: (reason) => {
    set((state) => ({
      incomingCallProjection: {
        ...state.incomingCallProjection,
        selectedBreakReason: reason,
      },
    }));
  },

  applyMultiCallSettings: (settings) => {
    set((state) => ({
      multiCallProjection: setMultiCallSettings(state.multiCallProjection, settings),
    }));
  },

  setCallHistoryLoading: () => {
    set((state) => ({
      callHistoryProjection: applyCallHistoryLoading(state.callHistoryProjection),
    }));
  },

  setCallHistoryLoaded: (entries) => {
    set((state) => ({
      callHistoryProjection: applyCallHistoryLoaded(state.callHistoryProjection, entries),
    }));
  },

  setCallHistoryLoadError: (errorKey) => {
    set((state) => ({
      callHistoryProjection: applyCallHistoryLoadError(state.callHistoryProjection, errorKey),
    }));
  },

  setContactsLoading: () => {
    set((state) => ({
      contactsProjection: applyContactsLoading(state.contactsProjection),
    }));
  },

  setContactsLoaded: (contacts) => {
    set((state) => ({
      contactsProjection: applyContactsLoaded(state.contactsProjection, contacts),
    }));
  },

  setContactsLoadError: (errorKey) => {
    set((state) => ({
      contactsProjection: applyContactsLoadError(state.contactsProjection, errorKey),
    }));
  },
}));
