import { useState, type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import type {
  AccountBootstrapProjection,
  OperatorStatusProjection,
} from "@application/index.js";
import { StatusSelector } from "../components/status/StatusSelector.js";
import { StatusTimer } from "../components/status/StatusTimer.js";
import { LogoutReasonModal } from "../components/status/LogoutReasonModal.js";
import { useOperatorStatusActions } from "../hooks/useOperatorStatusActions.js";

type OperatorFeatureShellProps = Readonly<{
  facade: AccountBootstrapFacade;
  projection: AccountBootstrapProjection;
  operatorStatusProjection: OperatorStatusProjection;
}>;

/**
 * - Purpose: compose operator status selector, timer, and logout modal.
 * - Inputs: facade and operator/account projections from store.
 * - Outputs: operator status feature UI block.
 */
export function OperatorFeatureShell({
  facade,
  projection,
  operatorStatusProjection,
}: OperatorFeatureShellProps): JSX.Element {
  const [logoutSelectedReason, setLogoutSelectedReason] = useState<string | null>(null);
  const operatorStatusActions = useOperatorStatusActions({
    facade,
    operatorStatusProjection,
    accountProjection: projection,
  });

  return (
    <>
      <StatusSelector
        visible={operatorStatusActions.visible}
        currentStatus={operatorStatusActions.currentStatus}
        pendingStatus={operatorStatusActions.pendingStatus}
        statusChangeInProgress={operatorStatusActions.statusChangeInProgress}
        readyDisabledReason={operatorStatusActions.readyDisabledReason}
        breakDisabledReason={operatorStatusActions.breakDisabledReason}
        rejectionBanner={operatorStatusActions.rejectionBanner}
        breakReasonPickerVisible={operatorStatusActions.breakReasonPickerVisible}
        breakReasons={operatorStatusActions.breakReasons}
        selectedBreakReason={operatorStatusActions.selectedBreakReason}
        onReady={operatorStatusActions.handleReady}
        onBreak={operatorStatusActions.handleBreak}
        onSelectBreakReason={operatorStatusActions.handleSelectBreakReason}
        onConfirmBreak={operatorStatusActions.handleConfirmBreak}
        onOpenLogout={operatorStatusActions.handleOpenLogout}
      />

      <StatusTimer
        statusChangedAt={operatorStatusProjection.statusChangedAt}
        timerRunning={operatorStatusProjection.timerRunning}
        currentStatus={operatorStatusProjection.currentStatus}
      />

      <LogoutReasonModal
        open={operatorStatusActions.logoutModalOpen}
        reasons={operatorStatusActions.breakReasons}
        reasonRequired={operatorStatusProjection.allowedBreakReasonsCount > 0}
        selectedReason={logoutSelectedReason}
        onSelectReason={setLogoutSelectedReason}
        onSubmit={() => {
          operatorStatusActions.handleLogoutSubmit(logoutSelectedReason ?? "");
          setLogoutSelectedReason(null);
        }}
        onClose={() => {
          operatorStatusActions.handleCloseLogout();
          setLogoutSelectedReason(null);
        }}
      />
    </>
  );
}
