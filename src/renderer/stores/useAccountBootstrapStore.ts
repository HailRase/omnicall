import { create } from "zustand";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  initialAccountBootstrapProjection,
  reduceAccountBootstrapProjection,
  type AccountBootstrapProjection,
} from "@application/projections/accountBootstrapProjection.js";
import {
  initialCallProjection,
  reduceCallProjection,
  setDialpadMode,
  type CallProjection,
  type DialpadMode,
} from "@application/projections/callProjection.js";
import {
  initialActiveCallControlsProjection,
  reduceActiveCallControlsProjection,
  type ActiveCallControlsProjection,
} from "@application/projections/activeCallControlsProjection.js";
import {
  initialIncomingCallProjection,
  reduceIncomingCallProjection,
  setIncomingCallUiState,
  setIncomingRejectReasonRequired,
  type IncomingCallProjection,
  type IncomingCallUiState,
} from "@application/projections/incomingCallProjection.js";
type AccountBootstrapStore = Readonly<{
  projection: AccountBootstrapProjection;
  callProjection: CallProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  incomingCallProjection: IncomingCallProjection;
  bindFacade: (facade: AccountBootstrapFacade) => () => void;
  setCallMode: (mode: DialpadMode) => void;
  setIncomingUiState: (uiState: IncomingCallUiState) => void;
  setIncomingRejectReasonRequired: (required: boolean) => void;
  setIncomingBreakReason: (reason: string | null) => void;
}>;

export const useAccountBootstrapStore = create<AccountBootstrapStore>((set) => ({
  projection: initialAccountBootstrapProjection(),
  callProjection: initialCallProjection(),
  activeCallControlsProjection: initialActiveCallControlsProjection(),
  incomingCallProjection: initialIncomingCallProjection(),

  bindFacade: (facade) => {
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
      }));
    });

    return unsubscribe;
  },

  setCallMode: (mode) => {
    set((state) => ({
      callProjection: setDialpadMode(state.callProjection, mode),
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
}));
