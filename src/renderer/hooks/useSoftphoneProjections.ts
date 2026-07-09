import { useAccountBootstrapStore } from "../stores/useAccountBootstrapStore.js";

/**
 * - Purpose: subscribe to all softphone projection slices from the bootstrap store.
 * - Inputs: Zustand store selectors.
 * - Outputs: projection read models and UI-only store setters.
 */
export function useSoftphoneProjections() {
  const projection = useAccountBootstrapStore((state) => state.projection);
  const callProjection = useAccountBootstrapStore((state) => state.callProjection);
  const activeCallControlsProjection = useAccountBootstrapStore(
    (state) => state.activeCallControlsProjection,
  );
  const incomingCallProjection = useAccountBootstrapStore(
    (state) => state.incomingCallProjection,
  );
  const multiCallProjection = useAccountBootstrapStore(
    (state) => state.multiCallProjection,
  );
  const transferProjection = useAccountBootstrapStore((state) => state.transferProjection);
  const multiLineCallProjection = useAccountBootstrapStore(
    (state) => state.multiLineCallProjection,
  );
  const sipSessionHealthProjection = useAccountBootstrapStore(
    (state) => state.sipSessionHealthProjection,
  );
  const callVideoMediaUiProjection = useAccountBootstrapStore(
    (state) => state.callVideoMediaUiProjection,
  );
  const setCallMode = useAccountBootstrapStore((state) => state.setCallMode);
  const setIncomingUiState = useAccountBootstrapStore((state) => state.setIncomingUiState);
  const setIncomingBreakReason = useAccountBootstrapStore(
    (state) => state.setIncomingBreakReason,
  );
  const setIncomingRejectReasonRequired = useAccountBootstrapStore(
    (state) => state.setIncomingRejectReasonRequired,
  );
  const applyMultiCallSettings = useAccountBootstrapStore(
    (state) => state.applyMultiCallSettings,
  );

  return {
    projection,
    callProjection,
    activeCallControlsProjection,
    incomingCallProjection,
    multiCallProjection,
    transferProjection,
    multiLineCallProjection,
    sipSessionHealthProjection,
    callVideoMediaUiProjection,
    setCallMode,
    setIncomingUiState,
    setIncomingBreakReason,
    setIncomingRejectReasonRequired,
    applyMultiCallSettings,
  };
}

export type SoftphoneProjections = ReturnType<typeof useSoftphoneProjections>;
