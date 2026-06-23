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

type AccountBootstrapStore = Readonly<{
  projection: AccountBootstrapProjection;
  callProjection: CallProjection;
  bindFacade: (facade: AccountBootstrapFacade) => () => void;
  setCallMode: (mode: DialpadMode) => void;
}>;

export const useAccountBootstrapStore = create<AccountBootstrapStore>((set) => ({
  projection: initialAccountBootstrapProjection(),
  callProjection: initialCallProjection(),

  bindFacade: (facade) => {
    const unsubscribe = facade.eventPublisher.subscribe((event) => {
      set((state) => ({
        projection: reduceAccountBootstrapProjection(state.projection, event),
        callProjection: reduceCallProjection(state.callProjection, event),
      }));
    });

    return unsubscribe;
  },

  setCallMode: (mode) => {
    set((state) => ({
      callProjection: setDialpadMode(state.callProjection, mode),
    }));
  },
}));
