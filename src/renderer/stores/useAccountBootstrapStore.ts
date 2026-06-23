import { create } from "zustand";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import {
  initialAccountBootstrapProjection,
  reduceAccountBootstrapProjection,
  setBootstrapMode,
  setPhoneStatusProjection,
  type AccountBootstrapProjection,
} from "@application/projections/accountBootstrapProjection.js";
import type { PhoneStatus } from "@domain/index.js";

type AccountBootstrapStore = Readonly<{
  projection: AccountBootstrapProjection;
  bindFacade: (facade: AccountBootstrapFacade) => () => void;
  applyPhoneStatus: (status: PhoneStatus) => void;
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

  applyPhoneStatus: (status) => {
    set((state) => ({
      projection: setPhoneStatusProjection(state.projection, status),
    }));
  },
}));

export function setBootstrapModeInStore(isOcpMode: boolean): void {
  useAccountBootstrapStore.setState((state) => ({
    projection: setBootstrapMode(state.projection, isOcpMode),
  }));
}
