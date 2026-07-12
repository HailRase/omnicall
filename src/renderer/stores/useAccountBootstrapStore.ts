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
import {
  initialHeadsetConnectionProjection,
  mergeHeadsetUserSettingsIntoProjection,
  reduceHeadsetConnectionProjection,
  type HeadsetConnectionProjection,
} from "@application/projections/headset/headsetConnectionProjection.js";
import {
  initialHeadsetSyncBusyProjection,
  mapHeadsetSyncBusyState,
  type HeadsetSyncBusyProjection,
} from "@application/projections/headset/headsetSyncBusyProjection.js";
import {
  initialCallVideoMediaUiProjection,
  reduceCallVideoMediaUiProjection,
  type CallVideoMediaUiProjection,
} from "@application/projections/media/callVideoMediaUiProjection.js";

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
  headsetConnectionProjection: HeadsetConnectionProjection;
  headsetSyncBusyProjection: HeadsetSyncBusyProjection;
  callVideoMediaUiProjection: CallVideoMediaUiProjection;
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
  syncHeadsetUserSettingsToProjection: (
    settings: Readonly<{ headsetEnabled: boolean; headsetAutoReconnect: boolean }>,
  ) => void;
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
  headsetConnectionProjection: initialHeadsetConnectionProjection(),
  headsetSyncBusyProjection: initialHeadsetSyncBusyProjection(),
  callVideoMediaUiProjection: initialCallVideoMediaUiProjection(),

  bindFacade: (facade) => {
    facade.setHeadsetProjectionSources(
      () => useAccountBootstrapStore.getState().multiLineCallProjection,
      () => useAccountBootstrapStore.getState().incomingCallProjection,
      () => useAccountBootstrapStore.getState().projection.phoneStatus === "dnd",
    );
    set({
      headsetConnectionProjection: {
        ...useAccountBootstrapStore.getState().headsetConnectionProjection,
        isSupported: facade.getHeadsetGateway().isSupported(),
      },
    });

    const syncHeadsetBusy = (): void => {
      set({
        headsetSyncBusyProjection: mapHeadsetSyncBusyState(
          facade.getHeadsetSyncBusyState(),
        ),
      });
    };
    facade.setHeadsetSyncBusyListener(syncHeadsetBusy);

    const notifyHeadsetAfterCommit = (): void => {
      const committed = useAccountBootstrapStore.getState();
      facade.notifyHeadsetProjectionsChanged(committed.multiLineCallProjection);
      syncHeadsetBusy();
    };

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
      set((state) => {
        const multiLineCallProjection = reduceMultiLineCallProjection(
          state.multiLineCallProjection,
          event,
        );
        const incomingCallProjection = reduceIncomingCallProjection(
          state.incomingCallProjection,
          event,
        );
        return {
          projection: reduceAccountBootstrapProjection(state.projection, event),
          callProjection: reduceCallProjection(state.callProjection, event),
          activeCallControlsProjection: reduceActiveCallControlsProjection(
            state.activeCallControlsProjection,
            event,
          ),
          incomingCallProjection,
          multiCallProjection: reduceMultiCallProjection(state.multiCallProjection, event),
          transferProjection: reduceTransferProjection(state.transferProjection, event),
          multiLineCallProjection,
          sipSessionHealthProjection: reduceSipSessionHealthProjection(
            state.sipSessionHealthProjection,
            event,
          ),
          callHistoryProjection: reduceCallHistoryProjection(
            state.callHistoryProjection,
            event,
          ),
          contactsProjection: reduceContactsProjection(state.contactsProjection, event),
          headsetConnectionProjection: reduceHeadsetConnectionProjection(
            state.headsetConnectionProjection,
            event,
          ),
          callVideoMediaUiProjection: reduceCallVideoMediaUiProjection(
            state.callVideoMediaUiProjection,
            event,
          ),
        };
      });
      // Must run AFTER Zustand commits — calling getState() inside set() reads stale projections
      // and leaves headset lastSnapshot stuck on incoming (ring LED never clears).
      notifyHeadsetAfterCommit();

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

  syncHeadsetUserSettingsToProjection: (settings) => {
    set((state) => ({
      headsetConnectionProjection: mergeHeadsetUserSettingsIntoProjection(
        state.headsetConnectionProjection,
        settings,
      ),
    }));
  },
}));
