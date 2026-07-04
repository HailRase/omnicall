import { create } from "zustand";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type { MultiCallSettings } from "@application/index.js";
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
import {
  initialMultiCallProjection,
  reduceMultiCallProjection,
  setMultiCallSettings,
  type MultiCallProjection,
} from "@application/projections/multiCallProjection.js";
import {
  initialTransferProjection,
  reduceTransferProjection,
  type TransferProjection,
} from "@application/projections/transferProjection.js";
import {
  initialMultiLineCallProjection,
  reduceMultiLineCallProjection,
  type MultiLineCallProjection,
} from "@application/projections/multiLineCallProjection.js";
import {
  initialOperatorStatusProjection,
  reduceOperatorStatusProjection,
  type OperatorStatusProjection,
} from "@application/projections/operatorStatusProjection.js";
import {
  initialQueueInfoProjection,
  reduceQueueInfoProjection,
  type QueueInfoProjection,
} from "@application/projections/queueInfoProjection.js";
import {
  initialCampaignProjection,
  reduceCampaignProjection,
  type CampaignProjection,
} from "@application/projections/campaignProjection.js";
import {
  initialOcpNotificationProjection,
  reduceOcpNotificationProjection,
  type OcpNotificationProjection,
} from "@application/projections/ocpNotificationProjection.js";
import {
  initialSipSessionHealthProjection,
  reduceSipSessionHealthProjection,
  type SipSessionHealthProjection,
} from "@application/projections/sipSessionHealthProjection.js";
type AccountBootstrapStore = Readonly<{
  projection: AccountBootstrapProjection;
  callProjection: CallProjection;
  activeCallControlsProjection: ActiveCallControlsProjection;
  incomingCallProjection: IncomingCallProjection;
  multiCallProjection: MultiCallProjection;
  transferProjection: TransferProjection;
  multiLineCallProjection: MultiLineCallProjection;
  operatorStatusProjection: OperatorStatusProjection;
  queueInfoProjection: QueueInfoProjection;
  campaignProjection: CampaignProjection;
  ocpNotificationProjection: OcpNotificationProjection;
  sipSessionHealthProjection: SipSessionHealthProjection;
  bindFacade: (facade: AccountBootstrapFacade) => () => void;
  setCallMode: (mode: DialpadMode, dtmfPanelCallId?: string | null) => void;
  setIncomingUiState: (uiState: IncomingCallUiState) => void;
  setIncomingRejectReasonRequired: (required: boolean) => void;
  setIncomingBreakReason: (reason: string | null) => void;
  applyMultiCallSettings: (settings: MultiCallSettings) => void;
}>;

export const useAccountBootstrapStore = create<AccountBootstrapStore>((set) => ({
  projection: initialAccountBootstrapProjection(),
  callProjection: initialCallProjection(),
  activeCallControlsProjection: initialActiveCallControlsProjection(),
  incomingCallProjection: initialIncomingCallProjection(),
  multiCallProjection: initialMultiCallProjection(),
  transferProjection: initialTransferProjection(),
  multiLineCallProjection: initialMultiLineCallProjection(),
  operatorStatusProjection: initialOperatorStatusProjection(),
  queueInfoProjection: initialQueueInfoProjection(),
  campaignProjection: initialCampaignProjection(),
  ocpNotificationProjection: initialOcpNotificationProjection(),
  sipSessionHealthProjection: initialSipSessionHealthProjection(),

  bindFacade: (facade) => {
    void facade.refreshUserSettingsProjections({
      applyMultiCallSettings: (settings) => {
        set((state) => ({
          multiCallProjection: setMultiCallSettings(state.multiCallProjection, settings),
        }));
      },
    });

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
        operatorStatusProjection: reduceOperatorStatusProjection(
          state.operatorStatusProjection,
          event,
        ),
        queueInfoProjection: reduceQueueInfoProjection(
          state.queueInfoProjection,
          event,
        ),
        campaignProjection: reduceCampaignProjection(
          state.campaignProjection,
          event,
        ),
        ocpNotificationProjection: reduceOcpNotificationProjection(
          state.ocpNotificationProjection,
          event,
        ),
        sipSessionHealthProjection: reduceSipSessionHealthProjection(
          state.sipSessionHealthProjection,
          event,
        ),
      }));
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
}));
