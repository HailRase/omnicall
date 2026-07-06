import { useState, type JSX } from "react";
import type { AccountBootstrapFacade } from "@application/facades/AccountBootstrapFacade.js";
import { StatusSelector } from "../components/status/StatusSelector.js";
import { StatusTimer } from "../components/status/StatusTimer.js";
import { LogoutReasonModal } from "../components/status/LogoutReasonModal.js";
import { useOperatorStatusActions } from "../hooks/useOperatorStatusActions.js";
import { useSoftphoneProjections } from "../hooks/useSoftphoneProjections.js";

type OperatorFeatureShellProps = Readonly<{
  facade: AccountBootstrapFacade;
}>;

/**
 * - Purpose: compose operator status selector, timer, and logout modal.
 * - Inputs: account bootstrap facade.
 * - Outputs: operator status feature UI block.
 */
export function OperatorFeatureShell({ facade }: OperatorFeatureShellProps): JSX.Element {
  const { projection, operatorStatusProjection } = useSoftphoneProjections();
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
