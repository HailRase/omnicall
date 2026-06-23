import { create } from "zustand";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  initialAccountBootstrapProjection,
  reduceAccountBootstrapProjection,
  type AccountBootstrapProjection,
} from "@application/projections/accountBootstrapProjection.js";

type AccountBootstrapStore = Readonly<{
  projection: AccountBootstrapProjection;
  bindFacade: (facade: AccountBootstrapFacade) => () => void;
}>;

export const useAccountBootstrapStore = create<AccountBootstrapStore>((set) => ({
  projection: initialAccountBootstrapProjection(),

  bindFacade: (facade) => {
    const unsubscribe = facade.eventPublisher.subscribe((event) => {
      set((state) => ({
        projection: reduceAccountBootstrapProjection(state.projection, event),
      }));
    });

    return unsubscribe;
  },
}));
